const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const ACCOUNT = require('../constants').ACCOUNT;
const getStage = require('../helpers/get-stage');
const resize = require('../helpers/resize');

const BUCKET = 'echt.uat.us-west-2';
const S3 = new AWS.S3();

/**
 * @param {Object} user
 * @param {String} stage
 * @return {Promise}
 */
var storeUser = (user, stage) => {
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
 * @param {String} stage
 * @return {Promise}
 */
var storePhoto = (photo, stage) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.photos`,
    Item: photo
  };

  return docClient.put(params).promise().then((response) => {
    return response;
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
  // fixme - use verify with a key
  // const userKey = jwt.decode(request.headers['x-devicekey']);

  const user = {
    uuid: uuid(),
    name: request.body.name,
    status: ACCOUNT.REGISTERED
  };

  const stage = getStage(request.lambdaContext);

  var buffer = new Buffer(request.body.image, 'base64');

  return resize.toSmall(buffer).then((smallBuffer) => {
    var originalPhoto = {
      Bucket: BUCKET,
      Key: `users/user-${user.uuid}.jpg`,
      ContentType: 'image/jpeg',
      Body: buffer
    };

    var smallPhoto = {
      Bucket: BUCKET,
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

    return storeUser(user, stage);
  }).then(() => {
    const photo = {
      uuid: uuid(),
      userId: user.uuid,
      Item: {
        user: user,
        createdAt: new Date().toISOString()
      }
    };

    return storePhoto(photo, stage);
  }).then(() => {
    const newKey = generateRegisteredKey(user);

    return {
      success: true,
      deviceKey: newKey,
      user: user
    };
  });
};
