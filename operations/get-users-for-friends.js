const AWS = require('aws-sdk');

/**
 * @param {Array} friendIds
 * @return {Array} Matching users records
 */
module.exports = (friendIds) => {
  const table = `echt.users`;

  if (!friendIds.length) {
    return [];
  }

  // TODO Limit returned data about user
  const keys = friendIds.map(uuid => {
    return {
      uuid: uuid,
      userId: uuid
    };
  });
  const params = {
    RequestItems: {
      [table]: {
        Keys: keys,
        ProjectionExpression: '#uuid,#user.#name,#user.photo',
        ExpressionAttributeNames: {
          '#uuid': 'uuid',
          '#user': 'user',
          '#name': 'name'
        }
      }
    }
  };

  const docClient = new AWS.DynamoDB.DocumentClient();
  return docClient.batchGet(params).promise().then((data) => {
    return data.Responses[table];
  });
};
