const AWS = require('aws-sdk');

module.exports = (fromId, toId, status) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: `echt.friends`,
    Key: {
      'fromId': fromId,
      'toId': toId
    },
    UpdateExpression: 'set #status=:status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status
    },
    ReturnValues: 'ALL_NEW'
  };

  return docClient.update(params).promise().then(data => {
    return data.Attributes;
  });
};
