/* globals stage */

const AWS = require('aws-sdk');
const getStage = require('../helpers/get-stage');
const jwt = require('jsonwebtoken');
const STATUS = require('../constants').STATUS;
const config = require('../config');
const assert = require('assert');
const addErrorReporter = require('../helpers/error-reporter');

AWS.config.update({
  region: config.awsRegion
});

var storePhoto = (photo) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.photos`,
    Item: photo
  };

  return docClient.put(params).promise().then((response) => {
    return response;
  });
};

const addPhotoToNewsfeed = (userId, photoId) => {
  const params = {
    TableName: `echt.${stage}.photos`,
    KeyConditionExpression: '#uuid = :photoId',
    ExpressionAttributeNames: {
      '#uuid': 'uuid'
    },
    ExpressionAttributeValues: {
      ':photoId': photoId
    }
  };

  const docClient = new AWS.DynamoDB.DocumentClient();

  return docClient.query(params).promise().then((data) => {
    const item = data.Items[0];
    item.userId = userId;
    return storePhoto(item);
  });
};

const updateRequest = (fromId, toId, status) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: `echt.${stage}.friends`,
    Key: {
      'fromId': fromId,
      'toId': toId
    },
    UpdateExpression: 'set #status=:status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status
    },
    ReturnValues: 'ALL_NEW'
  };

  return docClient.update(params).promise().then(data => {
    return data.Attributes;
  });
};

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  assert(request.body.uuid);

  var friend;

  // The recipient confirms the request from the requester
  const requester = request.body.uuid;
  const recipient = deviceKey.userId;

  return Promise.all([
    updateRequest(requester, recipient, STATUS.ACCEPTED),
    updateRequest(recipient, requester, STATUS.ACCEPTED)
  ]).then((results) => {
    friend = results[0];
    // Share the selfie photo to your newsfeed
    return addPhotoToNewsfeed(recipient, friend.photoId);
  })
  .then(() => {
    return {
      success: true,
      friend: friend
    };
  })
  .catch(errorHandlers.catchPromise);
};
