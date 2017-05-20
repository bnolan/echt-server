/* globals stage */

const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
const getStage = require('../helpers/get-stage');
const resize = require('../helpers/resize');
const ACCOUNT = require('../constants').ACCOUNT;
const CAMERA = require('../constants').CAMERA;
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const storeUser = require('../operations/store-user');
const storePhoto = require('../operations/store-photo');
const storeFace = require('../operations/store-face');
const indexFace = require('../operations/index-face');
const generateRegisteredKey = require('../operations/generate-registered-key');
const assert = require('assert');

AWS.config.update({
  region: config.awsRegion
});

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  // FIXME - use verify with a key
  // const userKey = jwt.decode(request.headers['x-devicekey']);

  const user = {
    uuid: uuid(),
    pincode: request.body.pincode,
    status: ACCOUNT.REGISTERED
  };

  // PIN is optional on sign-up, can be set later
  if (user.pincode) {
    assert(user.pincode.length === 4);
  }

  global.stage = getStage(request.lambdaContext);

  var buffer = new Buffer(request.body.image, 'base64');

  return resize.toSmall(buffer).then((smallBuffer) => {
    const S3 = new AWS.S3();

    var originalPhoto = {
      Bucket: `echt.${stage}.${config.awsRegion}`,
      Key: `users/user-${user.uuid}.jpg`,
      ContentType: 'image/jpeg',
      Body: buffer
    };

    var smallPhoto = {
      Bucket: `echt.${stage}.${config.awsRegion}`,
      Key: `users/user-${user.uuid}-small.jpg`,
      ContentType: 'image/jpeg',
      Body: smallBuffer
    };

    const uploads = [
      S3.upload(originalPhoto).promise(),
      S3.upload(smallPhoto).promise()
    ];

    // Do both uploads in parallel
    return Promise.all(uploads);
  }).then((values) => {
    var original = values[0];
    var small = values[1];

    user.photo = {
      url: original.Location,
      original: {
        url: original.Location
      },
      small: {
        url: small.Location
      }
    };

    return values;
  }).then((values) => {
    // Index the face, in order to detect users in further selfies,
    // as well as to correlate friends for friendship requests
    var original = values[0];
    return indexFace(original.key);
  }).then((faceId) => {
    return Promise.all([
      storeUser(user),
      storeFace(faceId, user.uuid)
    ]);
  }).then(() => {
    const photo = {
      uuid: uuid(),

      // fixme: Use object.assign?
      url: user.photo.url,
      original: user.photo.original,
      small: user.photo.small,

      author: {
        uuid: user.uuid,
        name: user.name
      },
      info: {
        camera: CAMERA.FRONT_FACING
      },
      createdAt: new Date().toISOString()
    };

    photo.authorId = user.uuid;
    user.photo.uuid = photo.uuid;

    return storePhoto(photo, [user.uuid]);
  }).then(() => {
    const newKey = generateRegisteredKey(user);

    return {
      success: true,
      deviceKey: newKey,
      user: user
    };
  })
  .catch(errorHandlers.catchPromise);
};
