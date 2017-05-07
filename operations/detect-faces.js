/* globals stage */

const AWS = require('aws-sdk');
const config = require('../config');

/**
 * Analyses a photo for faces. The photo was previously uploaded
 * to a defined S3 bucket by the same user.
 * Does not store the face. Only the origina sign-up photo face gets stored,
 * in order to keep things simple for the moment.
 *
 * @param {String} objectKey S3 object (not a URL)
 * @return {Promise} Returning a FaceId
 */
module.exports = (objectKey) => {
  var rekognitionClient = new AWS.Rekognition();
  var params = {
    Image: {
      S3Object: {
        // Ensure photos can only be selected from a location we control
        Bucket: `echt.${stage}.${config.awsRegion}`,
        Name: objectKey
      }
    }
  };
  return rekognitionClient.detectFaces(params).promise().then((response) => {
    // TODO Fail when no faces are detected with reasonable confidence
    return response;
  });
};
