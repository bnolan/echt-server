const helper = require('../helpers/rekognition');

process.on('unhandledRejection', (err) => {
  console.trace();
  console.log(JSON.stringify(err));
});

helper.createCollection()
.then((data) => {
  console.log('Created rekognition collection: ', data);
});
