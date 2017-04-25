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
 * @param {String} stage
 * @return {Promise}
 */
const emptyCollection = (stage) => {
  return rekognition.listFaces({CollectionId: `echt.${stage}`})
    .promise()
    .then(data => {
      const faceIds = data.Faces.map(face => face.FaceId);
      if (faceIds.length) {
        return rekognition.deleteFaces({CollectionId: `echt.${stage}`, FaceIds: faceIds})
          .promise();
      } else {
        return Promise.resolve();
      }
    });
};

const createCollection = (stage) => {
  return rekognition.createCollection({CollectionId: `echt.${stage}`})
    .promise();
};

const deleteCollection = (stage) => {
  return rekognition.deleteCollection({CollectionId: `echt.${stage}`})
    .promise();
};

module.exports = {
  createCollection, deleteCollection, emptyCollection
};
