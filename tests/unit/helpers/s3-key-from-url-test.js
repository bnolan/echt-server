const test = require('tape');
const s3KeyFromUrl = require('../../../helpers/s3-key-from-url');

test('parses absolute URL without folder', (t) => {
  t.equal(
    s3KeyFromUrl('https://s3-us-west-2.amazonaws.com/echt.uat.us-west-2/key.jpg'),
    'key.jpg'
  );
  t.end();
});

test('parses absolute URL with folder', (t) => {
  t.equal(
    s3KeyFromUrl('https://s3-us-west-2.amazonaws.com/echt.uat.us-west-2/my/key.jpg'),
    'my/key.jpg'
  );
  t.end();
});
