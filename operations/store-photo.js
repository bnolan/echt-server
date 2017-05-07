/* globals stage */

const AWS = require('aws-sdk');
const assert = require('assert');

/**
 * Store a photo for one or more users.
 * Will override the userId property of an existing photo.
 * Assumes the authorId property is already set.
 *
 * @param {Object} photo
 * @param {Array} userIds
 * @return {Promise}
 */
module.exports = (photo, userIds) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const tableName = `echt.${stage}.photos`;

  assert(photo.uuid);
  assert(photo.authorId);

  // Iterate over friends and fan out to the photos table
  const photos = userIds.map((userId) => {
    return Object.assign({}, photo, {
      userId: userId
    });
  });

  const requests = photos.map((photo) => {
    return {
      PutRequest: {
        Item: photo
      }
    };
  });

  // Tablename needs to be a key, weird API
  const items = {};

  items[tableName] = requests;

  return docClient.batchWrite({RequestItems: items}).promise().then((response) => {
    return response;
  });
};
