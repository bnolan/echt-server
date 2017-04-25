/* globals stage */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const getStage = require('../helpers/get-stage');
const STATUS = require('../constants').STATUS;
const config = require('../config');
const assert = require('assert');
const addErrorReporter = require('../helpers/error-reporter');

AWS.config.update({
  region: config.awsRegion
});

/**
 * @param {Object} friend
 * @param {String} stage
 * @return {Promise}
 */
var storeFriend = (friend) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.friends`,
    Item: friend
  };

  return docClient.put(params).promise().then((response) => {
    return response;
  });
};

// todo - post to FriendRequests table

exports.handler = function (request) {
  const errorHandlers = addErrorReporter(request);

  // const photoKey = request.body.photoKey;
  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  assert(request.body.user);
  assert(request.body.photoId);

  const requester = deviceKey.userId;
  const recipient = request.body.user;

  // Start constructing friend record
  var base = {
    photoId: request.body.photoId,
    createdAt: new Date().toISOString(),
    status: STATUS.PENDING
  };

  // TODO Check friend and photo exists
  // TODO Check if friendship already exists (avoid duplicate key error)

  // Each friendship is denormalised into two rows, so that you can easily
  // query all friends for a user by fromId, regardless
  // who initiated the friendship. This ensures efficient DynamoDB querying
  // without duplicate provisioned throughput for a global secondary index.
  return Promise.all([
    storeFriend(Object.assign({}, base, {
      fromId: requester,
      toId: recipient,
      requester: true
    }), stage),
    storeFriend(Object.assign({}, base, {
      fromId: recipient,
      toId: requester,
      requester: false
    }), stage)
  ]).then(() => {
    return {
      success: true,
      friend: {
        uuid: recipient,
        status: STATUS.PENDING
      }
    };
  })
  .catch(errorHandlers.catchPromise);
};
