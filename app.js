const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();

// Handlers
const initializeSignUp = require('./handlers/initialize-sign-up');
const signUp = require('./handlers/sign-up');
const deleteAccount = require('./handlers/delete-account');
const newsfeed = require('./handlers/newsfeed');
const uploadPhoto = require('./handlers/upload-photo');
const replacePhoto = require('./handlers/replace-photo');
const deletePhoto = require('./handlers/delete-photo');
const friends = require('./handlers/friend-list');
const friendRequest = require('./handlers/friend-request');
const confirmFriend = require('./handlers/confirm-friend');

api.get('/sign-up', initializeSignUp.handler);
api.post('/sign-up', signUp.handler);
api.delete('/sign-up', deleteAccount.handler);

api.get('/photos', newsfeed.handler);
api.post('/photos', uploadPhoto.handler);
api.put('/photos', replacePhoto.handler);
api.delete('/photos', deletePhoto.handler);

api.get('/friends', friends.handler);
api.post('/friends', friendRequest.handler);
api.put('/friends', confirmFriend.handler);

module.exports = api;
