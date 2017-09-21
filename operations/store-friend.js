const AWS = require('aws-sdk');

/**
 * @param {Object} friend
 * @return {Promise}
 */
module.exports = (friend) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.friends`,
    Item: friend
  };

  return docClient.put(params).promise().then((response) => {
    return response;
  });
};
