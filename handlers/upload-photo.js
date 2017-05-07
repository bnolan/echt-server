/* globals stage */

const AWS = require('aws-sdk');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const getStage = require('../helpers/get-stage');
const resize = require('../helpers/resize');
const _ = require('lodash');
const assert = require('assert');
const ACTION = require('../constants').ACTION;
const PHOTO_STATUS = require('../constants').PHOTO_STATUS;
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const getFriends = require('../operations/get-friends');
const detectFaces = require('../operations/detect-faces');
const searchFacesByCroppedImage = require('../operations/search-faces-by-cropped-image');
const getUserIdsForFace = require('../operations/get-user-ids-for-face');
const getUser = require('../operations/get-user');
const storePhoto = require('../operations/store-photo');

const S3 = new AWS.S3();

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

/**
 * @param {Object} user uuid
 * @return {Promise => Object} action object
 */
var getAddFriendAction = (userId) => {
  return getUser(userId)
    .then((user) => {
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
    authorId: deviceKey.userId,
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
        actions.push(getAddFriendAction(friend));
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
  }).then(friends => {
    const friendIds = friends.map(friend => friend.toId);

    // I shouldn't be a friend of myself
    assert(friendIds instanceof Array);
    assert(!_.includes(friendIds, userId));

    // Post to my newsfeed + friends
    return storePhoto(photo, friendIds.concat([userId]));
  }).then(() => {
    return {
      success: true,
      photo: photo
    };
  }).catch(errorHandlers.catchPromise);
};
