if (process.env.NODE_ENV !== 'production') {
  // Long stack traces
  // See https://trace.js.org/
  // See https://github.com/aws/aws-sdk-js/issues/1358
  require('trace');
  Error.stackTraceLimit = 100;
}

process.on('unhandledRejection', (reason, p) => {
  console.log(JSON.stringify(reason));
  console.log(JSON.stringify(p));
});
