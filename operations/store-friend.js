/* global stage */

const AWS = require('aws-sdk');

/**
 * @param {Object} friend
 * @param {String} stage
 * @return {Promise}
 */
module.exports = (friend) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.friends`,
    Item: friend
  };

  return docClient.put(params).promise().then((response) => {
    return response;
  });
};
