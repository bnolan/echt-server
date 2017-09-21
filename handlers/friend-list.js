const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const getFriends = require('../operations/get-friends');
const getUsersForFriends = require('../operations/get-users-for-friends');

AWS.config.update({
  region: config.awsRegion
});

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  // Closed over because ... broken promises
  var friends;

  return getFriends(deviceKey.userId)
    .then(_friends => {
      friends = _friends.map(friend => {
        friend.uuid = friend.toId;
        delete friend.toId;
        delete friend.fromId;
        return friend;
      });
      const friendIds = _.uniq(friends.map(friend => friend.uuid));
      return getUsersForFriends(friendIds);
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
