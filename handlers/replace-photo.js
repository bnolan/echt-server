/* globals stage */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const getStage = require('../helpers/get-stage');
const assert = require('assert');
const config = require('../config');
const addErrorReporter = require('../helpers/error-reporter');
const getPhoto = require('../operations/get-photo');
const s3urls = require('s3urls');

const S3 = new AWS.S3();

AWS.config.update({
  // Region needs to be supported by Rekognition (and match the S3 bucket)
  region: config.awsRegion
});

/**
 * Replaces an existing photo with another version.
 * This is designed to replace temporary small files with larger ones
 * representing the same image content. It allows us to quickly upload
 * a small file for face reco, and upload a larger one in the background.
 *
 * Caution: Does NOT replace inline and small representations of the photo
 * to avoid DynamoDB writes. This handler can't be used to replace a photo
 * with different content.
 */
exports.handler = function (request) {
  const errorHandlers = addErrorReporter(request);

  // const photoKey = request.body.photoKey;

  global.stage = getStage(request.lambdaContext);

  assert(request.body.image, 'should have image');
  assert(request.body.uuid, 'should have uuid');

  // fixme - use verify with a key
  const deviceKey = jwt.decode(request.headers['x-devicekey']);

  // TODO Better way to get user identifeir
  const userId = deviceKey.userId;

  // Get buffer from json payload
  const buffer = new Buffer(request.body.image, 'base64');

  // Get existing photo to replace
  return getPhoto(request.body.uuid).then(photo => {
    assert(photo.author.uuid === userId, 'owns photo');

    // Infer S3 location from full URL. Required because photos
    // might be stored either in users/* or photos/* folders.
    const s3data = s3urls.fromUrl(photo.url);

    return S3.upload({
      Bucket: `echt.${stage}.${config.awsRegion}`,
      // Location doesn't change
      Key: s3data.Key,
      ContentType: 'image/jpeg',
      Body: buffer
    }).promise();
  }).then(upload => {
    return {
      success: true,
      url: upload.Location
    };
  }).catch(errorHandlers.catchPromise);
};
