const fs = require('fs');
const STATUS = require('../constants').STATUS;
const Automator = require('../tests/helpers/automator');
const jwt = require('jsonwebtoken');
const yargs = require('yargs')
  .usage('Creates a sample user with the provided image, in registered status')
  .demandOption(['stage', 'selfiePath'])
  .describe('stage', 'AWS "stage"')
  .describe('selfiePath', 'Path to a selfie JPG')
  .describe('name', 'Optional name')
  .describe('keys', 'Comma-separated list of device keys to establish friendships with')
  .argv;

process.on('unhandledRejection', (reason, p) => {
  console.log(JSON.stringify(reason));
  console.log(JSON.stringify(p));
});

global.ECHT_STAGE = yargs.stage;

const selfiePath = yargs.selfiePath;
const name = yargs.name;
const keys = yargs.keys.split(',');
const a = new Automator();

var deviceKey;

a.get('/sign-up')
  .then(r => {
    console.log('Received new deviceKey: ', r.deviceKey);
    const image = fs.readFileSync(selfiePath);
    const b64 = new Buffer(image).toString('base64');
    deviceKey = r.deviceKey; // without user details

    return a.post('/sign-up', {
      image: b64,
      name: name
    }, {
      'x-devicekey': deviceKey
    });
  })
  .then(r => {
    const user = r.user;
    console.log('Created user: ', user);

    deviceKey = r.deviceKey; // with user details

    const keysPromises = keys.map(friendKey => {
      const friend = jwt.decode(friendKey);
      a.post('/friends', {
        user: friend.userId,
        // TODO Send photo of *both* people
        photoId: user.photo.uuid
      }, {
        'x-devicekey': deviceKey
      }).then(r => {
        if (!r.success) {
          console.log(r);
          throw new Error('Friending failed');
        }
        console.log('Sent friend request to ' + r.friend.uuid);
        return r;
      }).then(r => {
        return a.put('/friends', {
          uuid: user.uuid, status: STATUS.ACCEPTED
        }, {
          'x-devicekey': friendKey
        });
      }).then(r => {
        if (!r.success) {
          console.log(r);
          throw new Error('Friending failed');
        }
        console.log('Confirmed friend request to ' + r.friend.uuid);
      });
    });

    return Promise.all(keysPromises);
  });
