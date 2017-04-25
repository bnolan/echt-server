const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();

// Handlers
const initializeSignUp = require('./handlers/initialize-sign-up');
const signUp = require('./handlers/sign-up');
const newsfeed = require('./handlers/newsfeed');
const uploadPhoto = require('./handlers/upload-photo');
const friends = require('./handlers/friend-list');
const friendRequest = require('./handlers/friend-request');
const confirmFriend = require('./handlers/confirm-friend');

api.get('/sign-up', initializeSignUp.handler);
api.post('/sign-up', signUp.handler);

api.get('/photos', newsfeed.handler);
api.post('/photos', uploadPhoto.handler);

api.get('/friends', friends.handler);
api.post('/friends', friendRequest.handler);
api.put('/friends', confirmFriend.handler);

module.exports = api;
