const helper = require('../helpers/dynamodb');
const config = require('../config');
const assert = require('assert');

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

// Only do this on test for now, don't want to accidentally
// kill uat or production.

assert(config.environment === 'test');

console.log(`# Recreating databases...`);
console.log('Dropping tables...');

// Recreate database
helper
  .dropUsers()
  .then(() => helper.dropPhotos())
  .then(() => helper.dropFaces())
  .then(() => helper.dropFriends())
  .then(() => {
    console.log('Creating tables...');
  })
  .then(() => helper.createUsers())
  .then(() => helper.createPhotos())
  .then(() => helper.createFaces())
  .then(() => helper.createFriends())
  .then(() => {
    console.log('Done recreating.');
  });
