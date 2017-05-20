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

// {
//   "user": {
//     "name": "Ben",
//     "photo": {
//       "original": {
//         "url": "https://my-photo"
//       },
//       "small": {
//         "url": "https://my-photo"
//       },
//       "url": "https://my-photo"
//     },
//     "status": "REGISTERED",
//     "uuid": "11df474c-195a-4810-a31c-0be270d580f4"
//   },
//   "userId": "11df474c-195a-4810-a31c-0be270d580f4",
//   "uuid": "11df474c-195a-4810-a31c-0be270d580f4"
// }
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

// {
//   uuid: '350bb912-11c4-414d-8bd7-446fbd80d475',
//   userId: '350bb912-11c4-414d-8bd7-446fbd80d475',
//   authorId: '350bb912-11c4-414d-8bd7-446fbd80d475',
//   url: {
//     url: 'http://photo-url'
//   },
//   small: {
//     url: 'http://photo-url'
//   },
//   original: {
//     url: 'http://photo-url'
//   },
//   "createdAt": "2017-04-17T10:46:53.393Z",
//   "info": {
//     "camera": "FRONT_FACING"
//   }
// }
const createPhotos = (stage) => {
  return create({
    TableName: `echt.${stage}.photos`,
    KeySchema: [
      { AttributeName: 'uuid', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'uuid', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: `echt.${stage}.photosByUserId`,
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 2,
          WriteCapacityUnits: 1
        }
      }
    ],
    // Most reads will be from the 'photosByUserId' index
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  });
};

const dropPhotos = (stage) => {
  return drop({
    TableName: `echt.${stage}.photos`
  });
};

// {
//   "faceId": "d4d38257-f97a-5632-af61-c643268d0768",
//   "userId": "d3265f13-f4d1-42ce-b973-e4f7de730c54"
// }
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

// {
//   "createdAt": "2017-04-17T10:47:28.112Z",
//   "fromId": "e1659ceb-9091-4b4a-b545-4703a1b54097",
//   "photoId": "6533f1a5-2cbc-44c4-a324-64c157d04536",
//   "requester": true,
//   "status": "ACCEPTED",
//   "toId": "350bb912-11c4-414d-8bd7-446fbd80d475"
// }
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
