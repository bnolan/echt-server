var AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({
  region: config.awsRegion
  // endpoint: 'http://127.0.0.1:8000'
});

var dynamodb = new AWS.DynamoDB();

const emptyFaces = () => {
  return dynamodb.scan({
    TableName: `echt.faces`
  })
    .promise()
    .then(data => {
      const requests = data.Items.map(item => {
        return {
          DeleteRequest: {
            Key: {
              faceId: item.faceId,
              userId: item.userId
            }
          }
        };
      });
      if (requests.length) {
        return dynamodb.batchWriteItem({
          RequestItems: {
            [`echt.faces`]: requests
          }
        }).promise();
      } else {
        return Promise.resolve();
      }
    });
};

module.exports = {
  emptyFaces
};
