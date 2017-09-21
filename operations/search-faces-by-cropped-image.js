const AWS = require('aws-sdk');
const resize = require('../helpers/resize');

/**
 * Finds the best match for a previously indexed face.
 *
 * @param {Object} faceRecord
 * @param {String} buffer
 * @return {Promise} Returning a searchFacesByImage result
 */
module.exports = (faceRecord, buffer) => {
  var rekognitionClient = new AWS.Rekognition();
  return resize.cropByBoundingBox(buffer, faceRecord.BoundingBox)
    .then(croppedImageStr => {
      var params = {
        CollectionId: `echt.faces`,
        Image: {
          Bytes: new Buffer(croppedImageStr, 'base64')
        },
        FaceMatchThreshold: 10,
        MaxFaces: 1

      };
      return rekognitionClient.searchFacesByImage(params).promise().then((response) => {
        // console.log('#searchFacesByCroppedImage:');
        // console.log(response);
        return response;
      });
    });
};
