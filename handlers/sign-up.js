/* globals stage */

const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const getStage = require('../helpers/get-stage');
const resize = require('../helpers/resize');
const ACCOUNT = require('../constants').ACCOUNT;
const CAMERA = require('../constants').CAMERA;
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');

AWS.config.update({
  region: config.awsRegion
});

const S3 = new AWS.S3();

/**
 * @param {Object} user
 * @return {Promise}
 */
var storeUser = (user) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.users`,
    Item: {
      userId: user.uuid,
      uuid: user.uuid,
      user: user
    }
  };

  return docClient.put(params).promise().then((response) => {
    return response;
  });
};

/**
 * @param {Object} photo
 * @return {Promise}
 */
var storePhoto = (photo) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.photos`,
    Item: photo
  };

  return docClient.put(params).promise().then((response) => response);
};

/**
 * @param {String} faceId
 * @param {String} userId
 * @return {Promise}
 */
var storeFace = (faceId, userId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.faces`,
    Item: {
      faceId: faceId,
      userId: userId
    }
  };

  return docClient.put(params).promise().then((response) => response);
};

/**
 * Analyses a photo for faces. The photo was previously uploaded
 * to a defined S3 bucket by the same user.
 *
 * @param {String} objectKey S3 object (not a URL)
 * @return {Promise} Returning a FaceId
 */
var indexFace = (objectKey) => {
  var rekognitionClient = new AWS.Rekognition();
  var params = {
    CollectionId: `echt.${stage}`,
    Image: {
      S3Object: {
        // Ensure photos can only be selected from a location we control
        Bucket: `echt.${stage}.${config.awsRegion}`,
        Name: objectKey
      }
    }
  };
  return rekognitionClient.indexFaces(params).promise().then((response) => {
    // TODO Fail when more than one face detected
    // TODO Limit multi face failure to similar bounding boxes,
    // avoid failing when photo captures people in the background
    // TODO Fail when face is detected with low confidence
    if (response.FaceRecords[0]) {
      return response.FaceRecords[0].Face.FaceId;
    }
  });
};

/**
 * @param {Object} user
 * @param {String} deviceId
 * @return {String}
 */
function generateRegisteredKey (user) {
  // fixme - sign jwt with a key

  return jwt.sign({
    userId: user.uuid,
    deviceId: uuid(),
    status: user.STATUS
  }, '', {
    algorithm: 'none'
  });
}

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  // fixme - use verify with a key
  // const userKey = jwt.decode(request.headers['x-devicekey']);

  const user = {
    uuid: uuid(),
    name: request.body.name,
    status: ACCOUNT.REGISTERED
  };

  global.stage = getStage(request.lambdaContext);

  var buffer = new Buffer(request.body.image, 'base64');

  return resize.toSmall(buffer).then((smallBuffer) => {
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

    photo.userId = user.uuid;
    user.photo.uuid = photo.uuid;

    return storePhoto(photo);
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
