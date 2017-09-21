const AWS = require('aws-sdk');

/**
 * @param {Object} photo
 * @return {Promise}
 */
module.exports = (faceId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  // console.log('#getUserIdsForFace');
  // console.log(faceId);

  var params = {
    TableName: `echt.faces`,
    KeyConditionExpression: 'faceId = :faceId',
    ExpressionAttributeValues: {
      ':faceId': faceId
    }
  };

  return docClient.query(params).promise().then((response) => {
    // console.log('#getUserIdsForFace response:');
    // console.log(response);

    if (response.Items.length > 0) {
      return response.Items[0].userId;
    }
  });
};
