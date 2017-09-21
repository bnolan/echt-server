const AWS = require('aws-sdk');

module.exports = (uuid) => {
  const params = {
    TableName: `echt.friends`,
    KeyConditionExpression: 'fromId = :fromId',
    ExpressionAttributeValues: {
      ':fromId': uuid
    }
  };

  const docClient = new AWS.DynamoDB.DocumentClient();

  return docClient.query(params).promise().then((data) => {
    return data.Items;
  });
};
