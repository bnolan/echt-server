/* globals stage */

const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
const ApiError = require('../helpers/api-error');
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
const detectFaces = require('../operations/detect-faces');
const generateRegisteredKey = require('../operations/generate-registered-key');

AWS.config.update({
  region: config.awsRegion
});

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  // FIXME - use verify with a key
  // const userKey = jwt.decode(request.headers['x-devicekey']);

  const user = {
    uuid: uuid(),
    status: ACCOUNT.REGISTERED
  };

  global.stage = getStage(request.lambdaContext);

  var buffer = new Buffer(request.body.image, 'base64');
  var originalKey;

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
    originalKey = values[0].key;
    return detectFaces(originalKey);
  }).then((response) => {
    const faceCount = response.FaceDetails.length;

    if (faceCount === 0) {
      throw new ApiError('No face in this photo');
    }

    if (faceCount > 1) {
      throw new ApiError('Too many faces in this photo');
    }

    return indexFace(originalKey);
  }).then((result) => {
    let faceId = result;

    return Promise.all([
      storeUser(user),
      storeFace(faceId, user.uuid)
    ]);
  }).then((result) => {
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
  }).then((result) => {
    const newKey = generateRegisteredKey(user);

    return {
      success: true,
      deviceKey: newKey,
      user: user
    };
  }).catch(err => {
    // Operational error, expose message to the user
    if (err instanceof ApiError) {
      return err.getResponse();
    }

    // Log unexpected (non-operational) errors internally
    return errorHandlers.catchPromise(err).then(() => {
      // Avoid leaking the internal error message and return a generic one
      return ApiError.getDefaultResponse();
    });
  });
};
