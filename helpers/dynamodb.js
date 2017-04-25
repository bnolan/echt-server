var AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({
  region: config.awsRegion
  // endpoint: 'http://127.0.0.1:8000'
});

var dynamodb = new AWS.DynamoDB();

function create (params) {
  return dynamodb.createTable(params).promise();
}

function drop (params, callback) {
  return dynamodb.deleteTable(params).promise();
}

const createUsers = (stage) => {
  return create({
    TableName: `echt.${stage}.users`,
    KeySchema: [
      { AttributeName: 'uuid', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'uuid', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 1
    }
  });
};

const dropUsers = (stage) => {
  return drop({
    TableName: `echt.${stage}.users`
  });
};

const createPhotos = (stage) => {
  return create({
    TableName: `echt.${stage}.photos`,
    KeySchema: [
      { AttributeName: 'uuid', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'uuid', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 1
    }
  });
};

const dropPhotos = (stage) => {
  return drop({
    TableName: `echt.${stage}.photos`
  });
};

const createFaces = (stage) => {
  return create({
    TableName: `echt.${stage}.faces`,
    KeySchema: [
      { AttributeName: 'faceId', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'faceId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 1
    }
  });
};

const dropFaces = (stage) => {
  return drop({
    TableName: `echt.${stage}.faces`
  });
};

const createFriends = (stage) => {
  // Each friendship is denormalised into two rows, so that you can easily
  // query all friends for a user by fromId, regardless
  // who initiated the friendship. This ensures efficient DynamoDB querying
  // without duplicate provisioned throughput for a global secondary index.
  return create({
    TableName: `echt.${stage}.friends`,
    KeySchema: [
      { AttributeName: 'fromId', KeyType: 'HASH' },
      { AttributeName: 'toId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'fromId', AttributeType: 'S' },
      { AttributeName: 'toId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 1
    }
  });
};

const dropFriends = (stage) => {
  return drop({
    TableName: `echt.${stage}.friends`
  });
};

const emptyFaces = (stage) => {
  return dynamodb.scan({
    TableName: `echt.${stage}.faces`
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
            [`echt.${stage}.faces`]: requests
          }
        }).promise();
      } else {
        return Promise.resolve();
      }
    });
};

module.exports = {
  createUsers, dropUsers, createPhotos, dropPhotos, createFaces, dropFaces, createFriends, dropFriends, emptyFaces
};
