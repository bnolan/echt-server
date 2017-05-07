'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');
const sinon = require('sinon');
const uuid = require('uuid/v4');

const userId = uuid();

const getPromiseStub = data => {
  return sinon.stub().returns({
    promise: () => Promise.resolve(data)
  });
};

const createFriends = friendIds => {
  return friendIds.map(friendId => {
    return {uuid: friendId};
  });
};

const createPhotos = (authorId, userIds) => {
  const photoId = uuid();
  const basePhoto = {
    original: {url: 'http://s3/bucket/original.jpg'},
    small: {url: 'http://s3/bucket/small.jpg'}
  };
  return userIds.map(userId => {
    return Object.assign({}, basePhoto, {uuid: photoId, userId: userId, authorId: authorId});
  });
};

const awsStub = {
  config: {
    update: sinon.stub()
  },
  DynamoDB: {},
  S3: {}
};

const deletePhoto = proxyquire('../../../operations/delete-photo', {
  'aws-sdk': awsStub
});

function setup ({friends, photos}) {
  const result = {};

  result.friends = friends;
  result.photos = photos;
  result.batchWriteStub = getPromiseStub({
    Attributes: {}
  });
  result.queryStub = getPromiseStub({
    data: {
      Count: result.photos.length,
      Items: result.photos
    }
  });

  // TODO: make this functional and not a side effect
  awsStub.DynamoDB.DocumentClient = function DocumentClient () {
    this.batchWrite = result.batchWriteStub;
    this.query = result.queryStub;
  };

  result.deleteObjectsStub = getPromiseStub({
    data: {
      Deleted: []
    }
  });

  awsStub.S3 = function S3 () {
    this.deleteObjects = result.deleteObjectsStub;
  };

  return result;
}

test('owner can delete a photo from everyone\'s feed', function (t) {
  const authorId = userId;
  const friends = createFriends([uuid()]);
  const photos = createPhotos(authorId, [authorId, friends[0].uuid]);
  const { batchWriteStub, deleteObjectsStub } = setup({
    friends: friends,
    photos: photos
  });

  deletePhoto(photos[0].uuid, authorId, 'my-stage').then((result) => {
    t.ok(batchWriteStub.calledOnce);
    const request = batchWriteStub.getCall(0).args[0].RequestItems;
    const tableName = Object.keys(request)[0];
    const deletedItems = request[tableName].map(item => {
      return item.DeleteRequest.Key;
    });
    t.deepEqual(deletedItems, [
      {uuid: photos[0].uuid, userId: authorId},
      {uuid: photos[0].uuid, userId: friends[0].uuid}
    ]);

    t.ok(deleteObjectsStub.calledOnce);
    const deletedObjects = deleteObjectsStub.getCall(0).args[0].Delete.Objects;
    t.deepEqual(deletedObjects, [
      {Key: 'original.jpg'},
      {Key: 'small.jpg'}
    ]);

    t.end();
  });
});

test('friend can only delete a photo from their own feed', function (t) {
  const authorId = userId;
  const friends = createFriends([uuid()]);
  const photos = createPhotos(authorId, [authorId, friends[0].uuid]);
  const { batchWriteStub } = setup({
    friends: friends,
    photos: photos
  });

  deletePhoto(photos[0].uuid, friends[0].uuid, 'my-stage').then((result) => {
    t.ok(batchWriteStub.calledOnce);
    const request = batchWriteStub.getCall(0).args[0].RequestItems;
    const tableName = Object.keys(request)[0];
    const deletedItems = request[tableName].map(item => {
      return item.DeleteRequest.Key;
    });
    t.deepEqual(deletedItems, [
      {uuid: photos[0].uuid, userId: friends[0].uuid}
    ]);
    t.end();
  });
});

test('unrelated user can not delete photo', function (t) {
  const authorId = userId;
  const friends = createFriends([uuid()]);
  const photos = createPhotos(authorId, [authorId, friends[0].uuid]);
  setup({
    friends: friends,
    photos: photos
  });

  deletePhoto(photos[0].uuid, 'other-user', 'my-stage').catch(err => {
    t.equals(err.message, 'User not in photo');
    t.end();
  });
});

test('photo not found', function (t) {
  const authorId = userId;
  const friends = createFriends([uuid()]);
  const photos = createPhotos(authorId, []);
  setup({
    friends: friends,
    photos: photos
  });

  deletePhoto('not-found', authorId, 'my-stage').catch(err => {
    t.equals(err.message, 'No photos found');
    t.end();
  });
});
