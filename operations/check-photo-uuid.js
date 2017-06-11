/* globals stage */

const AWS = require('aws-sdk');
const assert = require('assert');

/**
 * Search for a photo matching the uuid. Raises an error
 * if the photo exists.
 *
 * @param {String} photoId
 * @return {Promise}
 */
module.exports = (photoId) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: `echt.${stage}.photos`,
    KeyConditionExpression: '#uuid = :photoId',
    ExpressionAttributeValues: {
      ':photoId': photoId
    },
    ExpressionAttributeNames: {
      '#uuid': 'uuid'
    }
  };

  // Ensure exists
  assert(photoId, 'should have photoId');

  // Todo verify that you can't denial-of-service by
  // pasting in weird photo uuids. It looks good to me
  // but im always sketchy about regexps from stack overflow
  assert(photoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i), 'photoId should be a uuid');

  return docClient.query(params).promise().then((response) => {
    if (response.Items.length > 0) {
      throw new Error('Photo id already exists');
    }
  });
};
