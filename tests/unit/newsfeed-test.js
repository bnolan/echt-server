'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const sinon = require('sinon');

const deviceKey = jwt.sign({
  userId: uuid(),
  deviceId: uuid()
}, '', {
  algorithm: 'none'
});

const result = {
  Items: []
};

// Todo - make some helpers for all this aws stubbing

const dynamoStub = {
  DocumentClient: function DocumentClient () {
    this.scan = sinon.stub().returns({
      promise: () => Promise.resolve({
        Items: result.Items
      })
    });
  }
};

const configStub = {
  update: sinon.stub()
};

const awsStub = {
  config: configStub,
  DynamoDB: dynamoStub
};

const newsfeed = proxyquire('../../handlers/newsfeed', { 'aws-sdk': awsStub });

test('scan', function (t) {
  t.plan(2);

  const request = {
    headers: { 'x-devicekey': deviceKey }
  };

  newsfeed.handler(request).then((result) => {
    t.ok(result);
    t.ok(result['items']);
  });
});

test('is sorted', function (t) {
  t.plan(5);

  const request = {
    headers: { 'x-devicekey': deviceKey }
  };

  result.Items = [
    {uuid: '1234-aaaa', createdAt: '2017-03-25T23:59:41.210Z'},
    {uuid: '1234-bbbb', createdAt: '2017-01-25T23:59:41.210Z'},
    {uuid: '1234-cccc', createdAt: '2017-05-25T23:59:41.210Z'}
  ];

  newsfeed.handler(request).then((result) => {
    t.ok(result);
    t.ok(result['items']);
    t.equal(result['items'][0].uuid, '1234-cccc');
    t.equal(result['items'][1].uuid, '1234-aaaa');
    t.equal(result['items'][2].uuid, '1234-bbbb');
  });
});
