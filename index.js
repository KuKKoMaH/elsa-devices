const Pulsar = require('./Pulsar');

const pulsar = new Pulsar({
  deviceAddress: '04779389',
});

pulsar.onReady(() => {
  // pulsar.getTime().then(time => {
  //   console.log(time);
  // }).catch(( error ) => {
  //   console.log('get device time error', error);
  // });

  pulsar.getValues([3, 4, 5, 6, 7, 8, 9]).then(values => {
    const mapping = [
      ['Температура под. [°C]', 3],
      ['Температура обр. [°C]', 4],
      ['Перепад температур, [°C]', 5],
      ['Мощность [Гкал/ч]', 6],
      ['Энергия [Гкал]', 7],
      ['Объем [м^3]', 8],
      ['Расход [м^3/ч]', 9],
    ];
    const maxLength = Math.max.apply(Math, mapping.map(m => m[0].length));
    mapping.forEach(( [label, channel] ) => {
      console.log((label + ": ").padEnd(maxLength + 2, ' '), values[channel]);
    });
  });
});
