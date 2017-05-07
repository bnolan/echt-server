/* globals stage */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const getStage = require('../helpers/get-stage');
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const deletePhoto = require('../operations/delete-photo');

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

exports.handler = function (request) {
  const errorHandlers = addErrorReporter(request);

  const photoId = request.body.uuid;

  global.stage = getStage(request.lambdaContext);

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  // TODO Better way to get user identifeir
  const userId = deviceKey.userId;

  return deletePhoto(photoId, userId, stage).then(() => {
    return {
      success: true
    };
  }).catch(errorHandlers.catchPromise);
};
