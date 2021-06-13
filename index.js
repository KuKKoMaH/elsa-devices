const SerialPort = require('serialport');
const Ready = require('@serialport/parser-ready');

const Gpio = require('onoff').Gpio;

const pin11 = new Gpio(17, 'high');
const pin13 = new Gpio(27, 'high');
// pin.writeSync(1);

pin11.watch(( err, value ) => {
  if (err) throw err;
  console.log('pin11', value);
});
pin13.watch(( err, value ) => {
  if (err) throw err;
  console.log('pin13', value);
});
// pin11.writeSync(0);
// pin13.writeSync(0);

process.on('SIGINT', _ => {
  pin11.unexport();
  pin13.unexport();
});

SerialPort.list().then(( info ) => console.log(info));

const port = new SerialPort('/dev/ttyS0', {
  lock: true,
  // echo: true,
  // record: true,
  // autoOpen: false,
});
// port.flush(() => {

const parser = port.pipe(new Ready({ delimiter: 'READY' }));
parser.on('ready', () => console.log('the ready byte sequence has been received'));
parser.on('data', console.log); // all data after READY is received
// })

// port.open(function ( err ) {
//   if (err) {
//     return console.log('Error opening port: ', err.message);
//   }
//
//   // port.on('data', function ( data ) {
//   //   console.log('Data: ' + data);
//   // });
//   //
//   // port.on('error', function ( err ) {
//   //   console.log('Error: ', err.message);
//   // });
//   //
//   // port.on('close', function () {
//   //   console.log('port closed');
//   // });
//
//   // var sendBuffer = pack('04779389', '4', '', '');
//
//   const addr = '04779389';
//   const addrHex = '0048ED7D';
//
//   // setInterval(function () {
//   //const code = 0xF00F0FF00000000000A544;
//   const code = '04779389040A788A04D6';
//   // const code = '000000000A0C010079E6C34A';
//   // const code = '290213326199737721353708868';
//
//   // pin11.writeSync(1);
//   // pin13.writeSync(1);
//   // port.write(Buffer.from(code, 'hex'), function ( err, bytes ) {
//   //   pin11.writeSync(0);
//   //   pin13.writeSync(0);
//   //   port.drain(( err ) => {
//   //     if (err) console.log('err', err);
//   //     // console.log(port.read());
//   //
//   //   });
//   //   // console.log('send error:', err);
//   //   // console.log('send: ' + bytes);
//   //
//   // });
//
//   // }, 1000);
// });
