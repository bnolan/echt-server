const AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

exports.handler = function (request) {
  return {
    success: false,
    message: 'Not implemented yet'
  };
};
