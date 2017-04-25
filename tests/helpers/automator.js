'use strict';

const app = require('../../app');

class Automator {
  get (path, queryString, headers) {
    return new Promise((resolve, reject) => {
      app.proxyRouter({
        requestContext: {
          resourcePath: path,
          httpMethod: 'GET'
        },
        queryStringParameters: queryString,
        headers: headers
      }, {
        done: function (err, response) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(response.body));
          }
        }
      });
    });
  }

  put (path, jsonBody, headers) {
    return new Promise((resolve, reject) => {
      var headersWithDefaults = Object.assign({'content-type': 'application/json'}, headers);
      app.proxyRouter({
        requestContext: {
          resourcePath: path,
          httpMethod: 'PUT'
        },
        headers: headersWithDefaults,
        body: JSON.stringify(jsonBody)
      }, {
        done: function (err, response) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(response.body));
          }
        }
      });
    });
  }

  post (path, jsonBody, headers) {
    return new Promise((resolve, reject) => {
      var headersWithDefaults = Object.assign({'content-type': 'application/json'}, headers);
      app.proxyRouter({
        requestContext: {
          resourcePath: path,
          httpMethod: 'POST'
        },
        headers: headersWithDefaults,
        body: jsonBody
      }, {
        done: function (err, response) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(response.body));
          }
        }
      });
    });
  }
}

module.exports = Automator;
