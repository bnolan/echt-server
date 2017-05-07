const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');

/**
 * @param {Object} user
 * @param {String} deviceId
 * @return {String}
 */
module.exports = (user) => {
  // fixme - sign jwt with a key

  return jwt.sign({
    userId: user.uuid,
    deviceId: uuid(),
    status: user.STATUS
  }, '', {
    algorithm: 'none'
  });
}
