function flipHexString( hexValue ) {
  let result = '';
  for (let i = 0; i < hexValue.length; i += 2) {
    result = hexValue.substr(i, 2) + result;
  }
  return result;
}


function hexToFloat( hex ) {
  hex = '0x' + flipHexString(hex);
  const s = hex >> 31 ? -1 : 1;
  const e = (hex >> 23) & 0xFF;
  return s * (hex & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, (e - 127));
}

module.exports = { flipHexString, hexToFloat };
