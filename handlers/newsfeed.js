var AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (request) => {
  const errorHandlers = addErrorReporter(request);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  const params = {
    TableName: `echt.photos`,
    IndexName: `echt.photosByUserId`,
    KeyConditionExpression: 'userId = :id',
    ScanIndexForward: false, // sort descending by createdAt
    ExpressionAttributeValues: {
      ':id': deviceKey.userId
    }
  };

  return docClient.query(params).promise().then((data) => {
    return {
      success: true,
      items: _.sortBy(data.Items, (i) => {
        return 0 - new Date(i.createdAt).getTime();
      })
    };
  })
  .catch(errorHandlers.catchPromise);
};
