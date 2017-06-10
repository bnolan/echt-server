var express = require('express');
var bodyParser = require('body-parser');
const Automator = require('./tests/helpers/automator');
const yargs = require('yargs')
    .default('stage', 'uat')
    .argv;
const qs = require('querystring');

// Used in pseudo-lambda handlers
global.ECHT_STAGE = yargs.stage;

const a = new Automator();
const app = express();
app.use(bodyParser.json({limit: '50mb'}));

app.all('/:path', function (req, res) {
  const method = req.method.toLowerCase();
  const path = req.path;
  const body = (method === 'get') ? qs.stringify(req.query) : req.body;
  const headers = req.headers;
  const id = `${req.method} ${path}`;
  console.log(id);
  a[method](path, body, headers).then(r => {
    console.log(id, JSON.stringify(r, null, ' '));
    // TODO Type-safe comparison
    // Responses can either be the body itself, or a ApiResponse object.
    // See https://github.com/claudiajs/example-projects/blob/master/web-api-custom-status-code/web.js
    if (r.response) {
      res.status(r.code);
      res.set(r.headers);
      res.send(r.response);
    } else {
      res.type('json');
      res.send(r);
    }
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
