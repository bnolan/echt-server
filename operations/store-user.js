/* global stage */

const AWS = require('aws-sdk');

/**
 * @param {Object} user
 * @return {Promise}
 */
module.exports = (user) => {
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
