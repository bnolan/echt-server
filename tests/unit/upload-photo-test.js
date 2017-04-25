'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const fs = require('fs');
const path = require('path');

const userId = uuid();

const deviceKey = jwt.sign({
  userId: userId,
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

const rekognitionIndexFacesStub = sinon.stub().returns({
  promise: () => Promise.resolve({
    FaceRecords: [
      {
        Face: {
          BoundingBox: {
            Height: 0.3,
            Left: 0.3,
            Top: 0.3,
            Width: 0.3
          },
          Confidence: 99.99,
          FaceId: 'my-faceid',
          ImageId: 'my-imageid'
        }
      }
    ]
  })
});

const rekognitionStub = function Rekognition () {
  this.indexFaces = rekognitionIndexFacesStub;
};

const resizeStub = {
  toSmall: (buffer) => Promise.resolve(buffer),
  toInline: (buffer) => Promise.resolve('DECAFBAD')
};

const awsStub = {
  config: configStub,
  DynamoDB: dynamoStub,
  Rekognition: rekognitionStub,
  S3: s3Stub
};

const uploadPhoto = proxyquire('../../handlers/upload-photo', {
  'aws-sdk': awsStub,
  '../helpers/resize': resizeStub
});

test.skip('stores when called with valid object and a detected face', function (t) {
  const image = fs.readFileSync(path.join(__dirname, '../fixtures/ben-1.jpg'));
  const b64 = new Buffer(image).toString('base64');

  const request = {
    body: {
      image: b64
    },
    headers: { 'x-devicekey': deviceKey }
  };
  uploadPhoto.handler(request).then((result) => {
    t.ok(dynamoPutStub.calledOnce);
    const putCall = dynamoPutStub.getCall(0);
    t.equal(putCall.args[0].Item.userId, userId);

    // fixme:
    // t.equal(putCall.args[0].Item.faceId, 'my-faceid');

    t.ok(result);
    t.end();
  });
});
