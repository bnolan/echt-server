const AWS = require('aws-sdk');

/**
 * Gets the first photo matching a uuid.
 * Caution: Will retrieve the photo with a random userId.
 *
 * @param {String} photoId
 * @return {Promise => Object} photo
 */
module.exports = (photoId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.photos`,
    KeyConditionExpression: '#uuid = :photoId',
    ExpressionAttributeValues: {
      ':photoId': photoId
    },
    ExpressionAttributeNames: {
      '#uuid': 'uuid'
    }
  };

  return docClient.query(params).promise().then((response) => {
    return response.Items[0];
  });
};
