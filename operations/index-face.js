/* global stage */

const AWS = require('aws-sdk');
const config = require('../config');

/**
 * Analyses a photo for faces. The photo was previously uploaded
 * to a defined S3 bucket by the same user.
 *
 * @param {String} objectKey S3 object (not a URL)
 * @return {Promise} Returning a FaceId
 */
module.exports = (objectKey) => {
  var rekognitionClient = new AWS.Rekognition();
  var params = {
    CollectionId: `echt.${stage}`,
    Image: {
      S3Object: {
        // Ensure photos can only be selected from a location we control
        Bucket: `echt.${stage}.${config.awsRegion}`,
        Name: objectKey
      }
    }
  };
  return rekognitionClient.indexFaces(params).promise().then((response) => {
    // TODO Fail when more than one face detected
    // TODO Limit multi face failure to similar bounding boxes,
    // avoid failing when photo captures people in the background
    // TODO Fail when face is detected with low confidence
    if (response.FaceRecords[0]) {
      return response.FaceRecords[0].Face.FaceId;
    }
  });
};
