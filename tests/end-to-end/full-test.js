const fs = require('fs');
const path = require('path');
const Automator = require('../helpers/automator');
const test = require('tape-catch');
const CAMERA = require('../../constants').CAMERA;
const ACTION = require('../../constants').ACTION;
const STATUS = require('../../constants').STATUS;
const PHOTO_STATUS = require('../../constants').PHOTO_STATUS;
// const exec = require('child_process').exec;
const dynamodbHelper = require('../../helpers/dynamodb');
const rekognitionHelper = require('../../helpers/rekognition');
const config = require('../../config');
const yargs = require('yargs').argv;

// End-to-end test use the uat databases
const stage = yargs.stage ? yargs.stage : config.tapeTestStage;
global.ECHT_STAGE = stage;

test('🔥  empty collection', (t) => {
  rekognitionHelper.emptyCollection(stage)
    .then(() => {
      t.end();
    });
});

test('⚡️  empty table', (t) => {
  dynamodbHelper.emptyFaces(stage)
    .then(() => {
      t.end();
    });
});

test('🏊  full user flow', (t) => {
  var ben = {
    deviceKey: null,
    user: null
  };

  const a = new Automator();

  // Is this call necessary at all? Maybe could do some
  // captcha / robot prevention in here.
  t.test('👨  ben', (t) => {
    t.test('start signup', (t) => {
      t.plan(2);

      a.get('/sign-up', {}, {}).then(r => {
        t.ok(r.success);
        t.ok(r.deviceKey);

        ben.deviceKey = r.deviceKey;
      });
    });

    t.test('complete signup', (t) => {
      t.plan(6);

      const image = fs.readFileSync(path.join(__dirname, '../fixtures/ben-1.jpg'));
      const b64 = new Buffer(image).toString('base64');

      a.post('/sign-up', {
        image: b64,
        name: 'Ben'
      }, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.user);
        t.ok(r.user.uuid);
        t.ok(r.user.photo.url);
        t.ok(r.user.photo.small.url);
        t.equal(r.user.name, 'Ben');

        ben.user = r.user;

        // Devicekey now has user info in it too
        ben.deviceKey = r.deviceKey;
      });
    });

    t.test('get newsfeed', (t) => {
      t.plan(4);

      a.get('/photos', {}, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.items);
        t.equal(r.items.length, 1);
        t.equal(r.items[0].author.uuid, ben.user.uuid);
      });
    });

    t.test('take selfie', (t) => {
      t.plan(14);

      const image = fs.readFileSync(path.join(__dirname, '../fixtures/ben-2.jpg'));
      const b64 = new Buffer(image).toString('base64');

      a.post('/photos', { image: b64, camera: CAMERA.FRONT_FACING }, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.photo);
        t.ok(r.photo.uuid);
        t.ok(r.photo.createdAt);
        t.equal(r.photo.status, PHOTO_STATUS.UPLOADED);

        t.ok(r.photo.info);
        t.equal(r.photo.info.camera, CAMERA.FRONT_FACING);

        t.ok(r.photo.author);
        t.equal(r.photo.author.uuid, ben.user.uuid);

        t.ok(r.photo.isSelfie);

        // Not a selfie with friends, so no actions
        t.equal(r.photo.actions.length, 0);

        t.ok(r.photo.inline);
        t.ok(r.photo.inline.url.match(/data:/), 'Image string contains data pragma');
        t.ok(r.photo.inline.url.length > 0, 'Image string contains data');
      });
    });

    t.test('get newsfeed again', (t) => {
      t.plan(5);

      a.get('/photos', {}, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.items);
        t.equal(r.items.length, 2);
        t.equal(r.items[0].author.uuid, ben.user.uuid);
        t.equal(r.items[1].author.uuid, ben.user.uuid);
      });
    });
  });

  /* A wild Ingo appears! */

  var ingo = {
    deviceKey: null,
    user: null
  };

  t.test('👳  ingo', (t) => {
    t.test('signup', (t) => {
      t.plan(2);

      a.get('/sign-up', {}, {}).then(r => {
        t.ok(r.success);
        ingo.deviceKey = r.deviceKey;
      });

      const image = fs.readFileSync(path.join(__dirname, '../fixtures/ingo-1.jpg'));
      const b64 = new Buffer(image).toString('base64');

      a.post('/sign-up', {
        image: b64,
        name: 'Ingo'
      }, { 'x-devicekey': ingo.deviceKey }).then(r => {
        t.ok(r.success);
        ingo.user = r.user;
        ingo.deviceKey = r.deviceKey;
      });
    });
  });

  /* Ben friends Ingo */

  t.test('👨  ben', (t) => {
    var photo;

    t.test('take selfie with ingo', (t) => {
      t.plan(5);

      const image = fs.readFileSync(path.join(__dirname, '../fixtures/ben-ingo-1.jpg'));
      const b64 = new Buffer(image).toString('base64');

      a.post('/photos', { image: b64, camera: CAMERA.FRONT_FACING }, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);

        t.equal(r.photo.actions.length, 1);
        t.equal(r.photo.actions[0].type, ACTION.ADD_FRIEND);

        t.ok(r.photo.actions[0].user.uuid);
        t.ok(r.photo.actions[0].user.avatar);

        photo = r.photo;
      });
    });

    var ingoUuid;

    t.test('send friend request', (t) => {
      t.plan(3);

      ingoUuid = photo.actions[0].user.uuid;

      a.post('/friends', { user: ingoUuid, photoId: photo.uuid }, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.friend);
        t.equal(r.friend.status, STATUS.PENDING);
      });
    });

    t.test('view friend request', (t) => {
      t.plan(6);

      a.get('/friends', {}, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.friends);
        t.equal(r.friends.length, 1);
        t.equal(r.friends[0].status, STATUS.PENDING);
        t.equal(r.friends[0].uuid, ingoUuid);
        t.ok(r.friends[0].name);
      });
    });

    t.end();
  });

  /* Ingo accepts request */

  t.test('👳 ingo', (t) => {
    // fixme - get the notification from some endpoint instead of
    // cheating and using bens uuid directly

    var friend;

    t.test('view pending request', (t) => {
      t.plan(5);

      a.get('/friends', {}, { 'x-devicekey': ingo.deviceKey }).then(r => {
        t.ok(r.success);
        t.equal(r.friends.length, 1);
        t.equal(r.friends[0].status, STATUS.PENDING);
        t.equal(r.friends[0].requester, false);
        t.equal(r.friends[0].uuid, ben.user.uuid);

        friend = r.friends[0];
      });
    });

    t.test('accept friend request', (t) => {
      t.plan(2);

      a.put('/friends', { uuid: friend.uuid, status: STATUS.ACCEPTED }, { 'x-devicekey': ingo.deviceKey }).then(r => {
        t.ok(r.success);
        t.equal(r.friend.status, STATUS.ACCEPTED);
      });
    });

    // Ingo can see the selfie ben took of them both

    t.test('get newsfeed', (t) => {
      t.plan(4);

      a.get('/photos', {}, { 'x-devicekey': ingo.deviceKey }).then(r => {
        t.ok(r.success);
        t.equal(r.items.length, 2);

        // Photos are sorted newest -> oldest
        t.equal(r.items[0].author.uuid, ben.user.uuid);
        t.equal(r.items[1].author.uuid, ingo.user.uuid);
      });
    });

    // Ingo takes a photo of hashigo zake

    t.test('take photo of hashigo', (t) => {
      t.plan(2);

      const image = fs.readFileSync(path.join(__dirname, '../fixtures/hashigo.jpg'));
      const b64 = new Buffer(image).toString('base64');

      a.post('/photos', { image: b64, camera: CAMERA.FRONT_FACING }, { 'x-devicekey': ingo.deviceKey }).then(r => {
        t.ok(r.success);
        t.ok(r.photo);
      });
    });

    t.end();
  });

  t.test('👨  ben', (t) => {
    t.test('get newsfeed', (t) => {
      t.plan(6);

      a.get('/photos', {}, { 'x-devicekey': ben.deviceKey }).then(r => {
        t.ok(r.success);
        t.equal(r.items.length, 4);

        // Should see bens signup selfie, selfie, ingo and ben selfie,
        // and ingos hashigo photo
        t.equal(r.items[0].author.uuid, ingo.user.uuid);
        t.equal(r.items[1].author.uuid, ben.user.uuid);
        t.equal(r.items[2].author.uuid, ben.user.uuid);
        t.equal(r.items[3].author.uuid, ben.user.uuid);
      });
    });

    t.end();
  });
});
