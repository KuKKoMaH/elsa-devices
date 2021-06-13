var ModbusRTU = require("modbus-serial");
var client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered("/dev/serial0", { baudRate: 9600 }, write);

function write() {
  client.setID(1);

  // write the values 0, 0xffff to registers starting at address 5
  // on device number 1.
  client.writeRegisters(1, [0x04 , 0x0A, 0x788A])
    .then(read)
    .catch(e => console.error(e));
}

function read() {
  // read the 2 registers starting at address 5
  // on device number 1.
  client.readHoldingRegisters(1, 5)
    .then(console.log)
    .catch(e => console.error(e));
}
