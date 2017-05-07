const AWS = require('aws-sdk');
const assert = require('assert');
const config = require('../config');
const s3KeyFromUrl = require('../helpers/s3-key-from-url');

/**
 * @param {String} photoId
 * @param {String} userId Can be owner or just a friend in the photo.
 * @param {String} stage
 * @return {Promise}
 */
module.exports = (photoId, userId, stage) => {
  assert(photoId);
  assert(userId);
  assert(stage);

  var photos;

  const docClient = new AWS.DynamoDB.DocumentClient();
  const tableName = `echt.${stage}.photos`;
  const params = {
    TableName: tableName,
    KeyConditionExpression: '#uuid = :photoId',
    ExpressionAttributeValues: {
      ':photoId': photoId
    },
    ExpressionAttributeNames: {
      '#uuid': 'uuid'
    }
  };

  return docClient.query(params).promise().then((data) => {
    // There's multiple records for the same photo,
    // one entry for each friend in the photo.
    photos = data.Items;

    if (!photos.length) {
      throw new Error('No photos found');
    }

    // Permission check
    const isInPhoto = photos.find(photo => {
      return (photo.userId === userId);
    });
    if (!isInPhoto) {
      throw new Error('User not in photo');
    }

    // If you are the owner of a photo, you should be able to delete it from everybody’s feed.
    // If you are only *in* the photo, you should only be able to delete it from your own feed.
    const isOwner = photos.find(photo => {
      return (
        photo.userId === userId &&
        photo.authorId === userId
      );
    });

    const requests = photos
      .filter(photo => {
        // Only delete all photos if the requesting user is the owner
        return (photo.userId === userId || isOwner);
      })
      .map(photo => {
        return {
          DeleteRequest: {
            Key: {
              uuid: photo.uuid,
              userId: photo.userId
            }
          }
        };
      });

    // Tablename needs to be a key, weird API
    const items = {};
    items[tableName] = requests;

    return docClient.batchWrite({RequestItems: items}).promise();
  }).then(response => {
    const s3 = new AWS.S3();

    // URLs are the same on all returned photos
    assert(photos.length > 0);
    const urls = [photos[0].original.url, photos[0].small.url];
    const objects = urls.map(url => {
      return {
        Key: s3KeyFromUrl(url)
      };
    });
    const params = {
      Bucket: `echt.${stage}.${config.awsRegion}`,
      Delete: {
        Objects: objects
      }
    };
    return s3.deleteObjects(params).promise();
  }).then(response => {
    return {
      success: true
    };
  });
};
