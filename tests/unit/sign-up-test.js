'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');

process.on('unhandledRejection', (err) => {
  throw err;
});

const deviceKey = jwt.sign({
  userId: uuid(),
  deviceId: uuid()
}, '', {
  algorithm: 'none'
});

const configStub = {
  update: sinon.stub()
};

const s3UploadStub = sinon.stub().returns({
  promise: () => Promise.resolve({
    Attributes: {}
  })
});

const s3Stub = function S3 () {
  this.upload = s3UploadStub;
};

const dynamoPutStub = sinon.stub().returns({
  promise: () => Promise.resolve({
    Attributes: {}
  })
});

const dynamoStub = {
  DocumentClient: function DocumentClient () {
    this.put = dynamoPutStub;
  }
};

const awsStub = {
  config: configStub,
  DynamoDB: dynamoStub,
  S3: s3Stub
};

const resizeStub = {
  toSmall: (buffer) => Promise.resolve(buffer),
  toInline: (buffer) => Promise.resolve('DECAFBAD')
};

const signUp = proxyquire('../../handlers/sign-up', {
  'aws-sdk': awsStub,
  '../helpers/resize': resizeStub
});

function getRequest () {
  const image = fs.readFileSync(path.join(__dirname, '../fixtures/ben-1.jpg'));
  const b64 = new Buffer(image).toString('base64');

  return {
    body: {
      name: 'my-name',
      image: b64
    },
    headers: { 'x-devicekey': deviceKey }
  };
}

test.skip('creates user with unique key', function (t) {
  const request = getRequest();
  var results = [];
  Promise.all([
    signUp.handler(request).then((result) => results.push(result)),
    signUp.handler(request).then((result) => results.push(result))
  ]).then(() => {
    t.doesNotEqual(results[0].user.uuid, results[1].user.uuid);
    t.end();
  });
});
