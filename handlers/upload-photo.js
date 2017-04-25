/* globals stage */

const AWS = require('aws-sdk');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const getStage = require('../helpers/get-stage');
const resize = require('../helpers/resize');
const _ = require('lodash');
const ACTION = require('../constants').ACTION;
const PHOTO_STATUS = require('../constants').PHOTO_STATUS;
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const getFriends = require('./queries/get-friends');
const assert = require('assert');

const S3 = new AWS.S3();

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

/**
 * Analyses a photo for faces. The photo was previously uploaded
 * to a defined S3 bucket by the same user.
 * Does not store the face. Only the origina sign-up photo face gets stored,
 * in order to keep things simple for the moment.
 *
 * @param {String} objectKey S3 object (not a URL)
 * @return {Promise} Returning a FaceId
 */
var detectFaces = (objectKey) => {
  var rekognitionClient = new AWS.Rekognition();
  var params = {
    Image: {
      S3Object: {
        // Ensure photos can only be selected from a location we control
        Bucket: `echt.${stage}.${config.awsRegion}`,
        Name: objectKey
      }
    }
  };
  return rekognitionClient.detectFaces(params).promise().then((response) => {
    // TODO Fail when no faces are detected with reasonable confidence
    return response;
  });
};

/**
 * Finds the best match for a previously indexed face.
 *
 * @param {Object} faceRecord
 * @param {String} buffer
 * @return {Promise} Returning a searchFacesByImage result
 */
var searchFacesByCroppedImage = (faceRecord, buffer) => {
  var rekognitionClient = new AWS.Rekognition();
  return resize.cropByBoundingBox(buffer, faceRecord.BoundingBox)
    .then(croppedImageStr => {
      var params = {
        CollectionId: `echt.${stage}`,
        Image: {
          Bytes: new Buffer(croppedImageStr, 'base64')
        },
        FaceMatchThreshold: 10,
        MaxFaces: 1

      };
      return rekognitionClient.searchFacesByImage(params).promise().then((response) => {
        // console.log('#searchFacesByCroppedImage:');
        // console.log(response);
        return response;
      });
    });
};

/**
 * @param {Object} photo
 * @return {Promise}
 */
var getUserIdsForFace = (faceId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  // console.log('#getUserIdsForFace');
  // console.log(faceId);

  var params = {
    TableName: `echt.${stage}.faces`,
    KeyConditionExpression: 'faceId = :faceId',
    ExpressionAttributeValues: {
      ':faceId': faceId
    }
  };

  return docClient.query(params).promise().then((response) => {
    // console.log('#getUserIdsForFace response:');
    // console.log(response);

    if (response.Items.length > 0) {
      return response.Items[0].userId;
    }
  });
};

/**
 * @param {Object} photo
 * @return {Promise}
 */
var storePhoto = (photo, friendIds) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const tableName = `echt.${stage}.photos`;

  // Iterate over friends and fan out to the photos table
  const photos = friendIds.map((uuid) => {
    return Object.assign({}, photo, {userId: uuid});
  });

  const requests = photos.map((photo) => {
    return {
      PutRequest: {
        Item: photo
      }
    };
  });

  // Tablename needs to be a key, weird API
  const items = {};

  items[tableName] = requests;

  return docClient.batchWrite({RequestItems: items}).promise().then((response) => {
    return response;
  });
};

/**
 * @param {String} user id
 * @return {Promise => Object} user
 */
var getUser = (userId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.users`,
    KeyConditionExpression: '#uuid = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ExpressionAttributeNames: {
      '#uuid': 'uuid'
    }
  };

  // console.log('#getUser', userId, params);

  return docClient.query(params).promise().then((response) => {
    // console.log('#getUser', response);
    return response.Items[0].user;
  });
};

/**
 * @param {Object} user uuid
 * @return {Promise => Object} action object
 */

var addFriend = (userId) => {
  return getUser(userId)
    .then((user) => {
      // console.log('addFriend', JSON.stringify(user));

      return {
        type: ACTION.ADD_FRIEND,
        user: {
          uuid: user.uuid,
          avatar: user.photo.url
        }
      };
    });
};

exports.handler = function (request) {
  const errorHandlers = addErrorReporter(request);

  // const photoKey = request.body.photoKey;

  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  // Get buffer from json payload
  const buffer = new Buffer(request.body.image, 'base64');

  // Start constructing photo record
  var photo = {
    uuid: uuid(),
    author: {
      uuid: deviceKey.userId
    },
    createdAt: new Date().toISOString(),
    info: {
      camera: request.body.camera
    },
    status: PHOTO_STATUS.UPLOADED,
    actions: []
  };

  // TODO Better way to get user identifeir
  const userId = deviceKey.userId;

  var uploads;

  return resize.toSmall(buffer).then((smallBuffer) => {
    var originalPhoto = {
      Bucket: `echt.${stage}.${config.awsRegion}`,
      Key: `photos/photo-${photo.uuid}-original.jpg`,
      ContentType: 'image/jpeg',
      Body: buffer
    };

    var smallPhoto = {
      Bucket: `echt.${stage}.${config.awsRegion}`,
      Key: `photos/photo-${photo.uuid}-small.jpg`,
      ContentType: 'image/jpeg',
      Body: smallBuffer
    };

    uploads = [
      S3.upload(originalPhoto).promise(),
      S3.upload(smallPhoto).promise()
    ];

    return resize.toInline(smallBuffer);
  }).then((base64) => {
    // Set the inline content
    photo.inline = {
      url: `data:image/jpg;base64,${base64}`
    };

    // Do both uploads in parallel
    return Promise.all(uploads);
  }).then((values) => {
    var original = values[0];
    var small = values[1];

    photo.url = {
      url: original.Location
    };
    photo.original = {
      url: original.Location
    };
    photo.small = {
      url: small.Location
    };

    return detectFaces(original.key);
  }).then((response) => {
    // console.log('detectFaces', JSON.stringify(response));
    photo.faceData = response;

    // TODO Only count "major" faces
    const detectedFacesCount = response.FaceDetails.length;

    photo.hasFaces = (detectedFacesCount > 0);

    // Only continue if the photo is a potential selfie,
    // or has exactly two faces in it (friendship request)
    if (detectedFacesCount === 0 || detectedFacesCount > 2) {
      return null;
    }

    // Search for matching faces for each face
    const faceLookups = response.FaceDetails.map((faceRecord) => {
      return searchFacesByCroppedImage(faceRecord, buffer)
        .then(response => {
          if (!response.FaceMatches.length) {
            return null;
          }

          // console.log('searchFacesByCroppedImage', JSON.stringify(response.FaceMatches[0]));

          if (response.FaceMatches.length > 0) {
            return response.FaceMatches[0].Face.FaceId;
          }
        }).then(faceId => {
          if (faceId) {
            return getUserIdsForFace(faceId);
          }
        });
    });

    return Promise.all(faceLookups);
  }).then((userIds) => {
    // Note that null entries in userIds are significant for the amount
    // of originally detected faces (even though they don't have a user match)
    // console.log('userIds', userIds);

    const actions = [];

    if (!userIds) {
      // No photos
    } else if (userIds.length === 1) {
      // Potential selfie
      if (userIds[0] === userId) {
        photo.isSelfie = true;
      }
    } else if (userIds.length === 2) {
      // Potential friendship request
      const me = _.includes(userIds, userId);
      const friend = _.without(userIds, userId)[0];

      if (me && friend) {
        console.log('FRIENDING!');
        actions.push(addFriend(friend));
      } else if (me && !friend) {
        console.log('LOL FRIEND DOESNT USE APP');
      } else if (!me && friend) {
        console.log('ITS NOT YOU BUT I KNOW THE OTHER PERSON');
      } else {
        console.log('wtf happened', me, friend);
      }
    }

    return Promise.all(actions);
  }).then((actions) => {
    // Add actions
    photo.actions = photo.actions.concat(actions);

    return getFriends(userId);
  }).then((friendIds) => {
    // I shouldn't be a friend of myself
    assert(friendIds instanceof Array);
    assert(!_.includes(friendIds, userId));

    // Post to my newsfeed + friends
    const uuids = friendIds.concat(userId);
    return storePhoto(photo, uuids);
  }).then(() => {
    return {
      success: true,
      photo: photo
    };
  }).catch(errorHandlers.catchPromise);
};
