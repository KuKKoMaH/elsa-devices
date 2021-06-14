const SerialPort = require('serialport');
const { checkSum: calcCRC16 } = require('node-crc16');
const Gpio = require('onoff').Gpio;
const { flipHexString, hexToFloat } = require('./helpers/hexToFloat');

module.exports = class Pulsar {
  deviceAddress = null;

  serialPort = null;
  gpio = null;

  onReadyCallback = null;

  readPromiseResolve = null;
  readPromiseReject = null;
  readMethod = null;
  readRequestId = null;
  readTimer = null;
  readBuffer = null;

  constructor( { deviceAddress } ) {
    this.deviceAddress = deviceAddress;
    this.serialPort = new SerialPort('/dev/serial0');
    this.serialPort.on('data', this.onData);
    this.serialPort.on('open', this.onOpen);
    this.serialPort.on('error', this.onError);

    this.gpio = [
      new Gpio(17, 'high'),
      new Gpio(27, 'high'),
    ];
  }

  onOpen = ( data ) => {
    console.log('Open');
    if (this.onReadyCallback) this.onReadyCallback();
    this.onReadyCallback = null;
  };

  onError = ( error ) => {
    console.log('Error', error);
  };

  onData = ( data ) => {
    console.log('Data: ', data, data.toString('hex'));
    if (typeof this.readBuffer === 'string') {
      this.readBuffer += data.toString('hex');
      this.processReadBuffer();
    }
  };

  processReadBuffer() {
    const { readBuffer } = this;
    const deviceAddressLength = this.deviceAddress.length;
    if (readBuffer.length < deviceAddressLength) return;
    if (readBuffer.indexOf(this.deviceAddress) !== 0) return this.readPromiseReject('wrong device address');

    const method = readBuffer.slice(deviceAddressLength, deviceAddressLength + 2);
    if (method.length === 2 && method !== this.readMethod) return this.readPromiseReject('wrong method');

    const length = parseInt(readBuffer.slice(deviceAddressLength + 2, deviceAddressLength + 4), 16);
    if (readBuffer.length !== length * 2) return;

    const requestId = readBuffer.slice(-8, -4);
    if (requestId !== this.readRequestId) return this.readPromiseReject('wrong ID');

    const crc16 = readBuffer.slice(-4);
    const restRequest = readBuffer.slice(0, -4);
    if (calcCRC16(restRequest) !== crc16) return this.readPromiseReject('wrong CRC16');

    this.readPromiseResolve(readBuffer.slice(deviceAddressLength + 4, -8));
  }

  setGPIOHigh() {
    this.gpio.forEach(pin => pin.writeSync(1));
  }

  setGPIOLow() {
    this.gpio.forEach(pin => pin.writeSync(0));
  }

  generateRequestId() {
    return (Math.random() * 0xffff * 1000000)
      .toString(16)
      .slice(0, 4);
  }

  readData( method, requestId ) {
    this.setGPIOLow();
    const readPromise = new Promise(( resolve, reject ) => {
      this.readMethod = method;
      this.readRequestId = requestId;
      this.readBuffer = '';
      this.readPromiseResolve = resolve;
      this.readPromiseReject = reject;
      this.readTimer = setTimeout(() => {
        reject(new Error('timeout'));
      }, 1000);
    });
    readPromise.finally(this.clearReadData);
    return readPromise;
  }

  clearReadData = () => {
    if (this.readTimer) clearTimeout(this.readTimer);
    this.readMethod = null;
    this.readRequestId = null;
    this.readBuffer = null;
    this.readPromiseResolve = null;
    this.readPromiseReject = null;
    this.readTimer = null;
  };

  sendRequest( method, data = '' ) {
    const requestId = this.generateRequestId();
    const requestLength = this.deviceAddress.length
      + 2 // Код функции запроса
      + 2 // Длина запроса
      + data.length
      + 4 // ID запроса
      + 4 // Сигнатура
    ;
    let request = this.deviceAddress
      + method
      + (requestLength / 2).toString(16).padStart(2, '0')
      + data
      + requestId
    ;
    request += calcCRC16(request);
    request = request.toUpperCase();
    console.log('send request: ', request);
    return new Promise(( resolve, reject ) => {
      this.setGPIOHigh();
      this.serialPort.flush(( flushError ) => {
        if (flushError) return reject(flushError);

        this.serialPort.write(Buffer.from(request, 'hex'), ( writeError ) => {
          if (writeError) return reject(writeError);
        });
        this.serialPort.drain(( drainError ) => {
          if (drainError) reject(drainError);
          this.readData(method, requestId).then(resolve, reject);

          // const d = this.serialPort.read(16);
          // console.log('data', d);
          // resolve();
        });
      });
    });
  }

  onReady( callback ) {
    this.onReadyCallback = callback;
  }

  getTime() {
    return this.sendRequest('04').then(( data ) => {
      const year = parseInt(data.slice(0, 2), 16);
      const month = parseInt(data.slice(2, 4), 16);
      const day = parseInt(data.slice(4, 6), 16);
      const hour = parseInt(data.slice(6, 8), 16);
      const minute = parseInt(data.slice(8, 10), 16);
      const second = parseInt(data.slice(10, 12), 16);
      return { year, month, day, hour, minute, second };
    });
  }

  getValues( channels ) {
    let mask = 0;
    channels.forEach(channel => {
      mask = mask | parseInt('1'.padEnd(channel, '0'), 2);
    });

    const data = flipHexString(mask.toString(16).padStart(8, '0'));
    return this.sendRequest('01', data).then(( data ) => {
      const sortedChannel = channels.sort(( a, b ) => a === b ? 0 : a < b ? -1 : 1);
      const values = data.match(/.{1,8}/g);
      return values.reduce(( dict, v, i ) => {
        dict[sortedChannel[i]] = hexToFloat(v);
        return dict;
      }, {});
    });
  }
};
