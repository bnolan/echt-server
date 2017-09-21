var AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({
  region: config.awsRegion
});

const rekognition = new AWS.Rekognition();

/**
 * Empties an existing collection (instead of delete+create)
 * in order to avoid timing issues.
 *
 * @return {Promise}
 */
const emptyCollection = () => {
  return rekognition.listFaces({CollectionId: `echt.faces`})
    .promise()
    .then(data => {
      const faceIds = data.Faces.map(face => face.FaceId);
      if (faceIds.length) {
        return rekognition.deleteFaces({CollectionId: `echt.faces`, FaceIds: faceIds})
          .promise();
      } else {
        return Promise.resolve();
      }
    });
};

const createCollection = () => {
  return rekognition.createCollection({CollectionId: `echt.faces`})
    .promise();
};

const deleteCollection = () => {
  return rekognition.deleteCollection({CollectionId: `echt.faces`})
    .promise();
};

module.exports = {
  createCollection, deleteCollection, emptyCollection
};
