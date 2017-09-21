const helper = require('../helpers/dynamodb');

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

// users
helper.createUsers()
  .then(data => {
    console.log('Created users table. Table description JSON:', JSON.stringify(data, null, 2));
  });

// photos
helper.createPhotos()
  .then(data => {
    console.log('Created photos table. Table description JSON:', JSON.stringify(data, null, 2));
  });

// faces
helper.createFaces()
  .then(data => {
    console.log('Created faces table. Table description JSON:', JSON.stringify(data, null, 2));
  });

// friends
helper.createFriends()
  .then(data => {
    console.log('Created friends table. Table description JSON:', JSON.stringify(data, null, 2));
  });
