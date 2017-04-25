/* globals stage */

const AWS = require('aws-sdk');
const getStage = require('../helpers/get-stage');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');

AWS.config.update({
  region: config.awsRegion
});

const getFriends = (uuid) => {
  const params = {
    TableName: `echt.${stage}.friends`,
    KeyConditionExpression: 'fromId = :fromId',
    ExpressionAttributeValues: {
      ':fromId': uuid
    }
  };

  const docClient = new AWS.DynamoDB.DocumentClient();

  return docClient.query(params).promise().then((data) => {
    return data.Items.map(friend => {
      friend.uuid = friend.toId;
      delete friend.toId;
      delete friend.fromId;
      return friend;
    });
  });
};

/**
 * @param {Array} friends Object with uuid attribute
 * @return {Array} Matching users records
 */
const getUsersForFriends = (friends) => {
  const table = `echt.${stage}.users`;
  const uuids = _.uniq(friends.map(friend => friend.uuid));

  if (!uuids.length) {
    return [];
  }

  // TODO Limit returned data about user
  const keys = uuids.map(uuid => {
    return {
      uuid: uuid,
      userId: uuid
    };
  });
  const params = {
    RequestItems: {
      [table]: {
        Keys: keys,
        ProjectionExpression: '#uuid,#user.#name,#user.photo',
        ExpressionAttributeNames: {
          '#uuid': 'uuid',
          '#user': 'user',
          '#name': 'name'
        }
      }
    }
  };

  const docClient = new AWS.DynamoDB.DocumentClient();
  return docClient.batchGet(params).promise().then((data) => {
    return data.Responses[table];
  });
};

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  // Closed over because ... broken promises
  var friends;

  return getFriends(deviceKey.userId)
    .then(_friends => {
      friends = _friends;
      return getUsersForFriends(friends);
    })
    .then(users => {
      return friends.map(friend => {
        const record = _.find(users, {uuid: friend.uuid});
        if (record) {
          friend = Object.assign(friend, record.user);
        }
        return friend;
      });
    })
    .then(friendsWithUsers => {
      return {
        success: true,
        friends: friendsWithUsers
      };
    })
    .catch(errorHandlers.catchPromise);
};
