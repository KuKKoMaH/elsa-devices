const Pulsar = require('./Pulsar');

const pulsar = new Pulsar({
  deviceAddress: '04779389',
});

pulsar.onReady(() => {
  pulsar.getTime().then(time => {
    console.log(time);
  }).catch(( error ) => {
    console.log('get device time error', error);
  });
});
