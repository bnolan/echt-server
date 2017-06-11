const AWS = require('aws-sdk');
const getStage = require('../helpers/get-stage');
const jwt = require('jsonwebtoken');
const STATUS = require('../constants').STATUS;
const config = require('../config');
const assert = require('assert');
const addErrorReporter = require('../helpers/error-reporter');
const getPhoto = require('../operations/get-photo');
const storePhoto = require('../operations/store-photo');
const updateFriendStatus = require('../operations/update-friend-status');

AWS.config.update({
  region: config.awsRegion
});

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  assert(request.body.uuid, 'should have request.body.uuid');

  var friend;

  // The recipient confirms the request from the requester
  const requester = request.body.uuid;
  const recipient = deviceKey.userId;

  return Promise.all([
    updateFriendStatus(requester, recipient, STATUS.ACCEPTED),
    updateFriendStatus(recipient, requester, STATUS.ACCEPTED)
  ])
  .then((results) => {
    friend = results[0];
    return getPhoto(friend.photoId);
  })
  .then(photo => {
    // Share the selfie photo to your newsfeed
    return storePhoto(photo, [recipient]);
  })
  .then(() => {
    return {
      success: true,
      friend: friend
    };
  })
  .catch(errorHandlers.catchPromise);
};
