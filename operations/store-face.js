const AWS = require('aws-sdk');

/**
 * @param {String} faceId
 * @param {String} userId
 * @return {Promise}
 */
module.exports = (faceId, userId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.faces`,
    Item: {
      faceId: faceId,
      userId: userId
    }
  };

  return docClient.put(params).promise().then((response) => response);
};
