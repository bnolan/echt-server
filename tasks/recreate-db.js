const helper = require('../helpers/dynamodb');
const config = require('../config');

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

// Only do this on test for now, don't want to accidentally
// kill uat or production.
const stages = [config.tapeTestStage];

stages.forEach(stage => {
  console.log(`# Recreating ${stages} databases...`);
  console.log('Dropping tables...');

  // Recreate database
  helper
    .dropUsers(stage)
    .then(() => helper.dropPhotos(stage))
    .then(() => helper.dropFaces(stage))
    .then(() => helper.dropFriends(stage))
    .then(() => {
      console.log('Creating tables...');
    })
    .then(() => helper.createUsers(stage))
    .then(() => helper.createPhotos(stage))
    .then(() => helper.createFaces(stage))
    .then(() => helper.createFriends(stage))
    .then(() => {
      console.log('Done recreating.');
    });
});
