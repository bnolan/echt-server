const helper = require('../helpers/rekognition');
const config = require('../config');
const yargs = require('yargs').argv;

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

const stages = yargs.stages ? yargs.stages.split(',') : config.defaultStages;
stages.forEach(stage => {
  helper.createCollection(stage)
    .then((data) => {
      console.log('Created rekognition collection: ', data);
    });
});
