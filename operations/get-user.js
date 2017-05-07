/* globals stage */

const AWS = require('aws-sdk');

/**
 * @param {String} user id
 * @return {Promise => Object} user
 */
module.exports = (userId) => {
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
