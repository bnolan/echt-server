const dynamodbHelper = require('../helpers/dynamodb');
const rekognitionHelper = require('../helpers/rekognition');
const sleep = require('sleep-promise');

if (process.argv.indexOf('YESIMSURE=1') < 0) {
  throw new Error('You must pass YESIMSURE=1 as a parameter to truncate uat');
}

const stage = 'uat';
global.ECHT_STAGE = stage;

console.log('Empty Rekognition...');

rekognitionHelper.emptyCollection(stage)
  .then(() => {
    console.log('dropUsers...');
    return dynamodbHelper.dropUsers(stage);
  })
  .then(() => {
    console.log('dropPhotos...');
    return dynamodbHelper.dropPhotos(stage);
  })
  .then(() => {
    console.log('dropFaces...');
    return dynamodbHelper.dropFaces(stage);
  })
  .then(() => {
    console.log('dropFriends...');
    return dynamodbHelper.dropFriends(stage);
  })
  .then(sleep(5000))
  .then(() => {
    console.log('createUsers...');
    return dynamodbHelper.createUsers(stage);
  })
  .then(() => {
    console.log('createPhotos...');
    return dynamodbHelper.createPhotos(stage);
  })
  .then(() => {
    console.log('createFaces...');
    return dynamodbHelper.createFaces(stage);
  })
  .then(() => {
    console.log('createFriends...');
    return dynamodbHelper.createFriends(stage);
  })
  .then(() => {
    console.log('Done');
  });
