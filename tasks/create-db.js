const helper = require('../helpers/dynamodb');
const config = require('../config');
const yargs = require('yargs').argv;

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

const stages = yargs.stages ? yargs.stages.split(',') : config.defaultStages;
stages.forEach(stage => {
  // users
  helper.createUsers(stage)
    .then(data => {
      console.log('Created users table. Table description JSON:', JSON.stringify(data, null, 2));
    });

  // photos
  helper.createPhotos(stage)
  .then(data => {
    console.log('Created photos table. Table description JSON:', JSON.stringify(data, null, 2));
  });

  // faces
  helper.createFaces(stage)
  .then(data => {
    console.log('Created faces table. Table description JSON:', JSON.stringify(data, null, 2));
  });

  // friends
  helper.createFriends(stage)
  .then(data => {
    console.log('Created friends table. Table description JSON:', JSON.stringify(data, null, 2));
  });
});
