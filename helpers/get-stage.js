/**
 * Infers the API Gateway stage name from the invoked lambda resource name.
 * Follows claudia.js conventions for suffixing lambda functions with the API Gateway stage.
 * Defaults to 'dev' if no context is available.
 *
 * See https://www.claudiajs.com/tutorials/versions.html
 *
 * @param {Object|null} context
 */
module.exports = (context) => {
  if (global.ECHT_STAGE) {
    return global.ECHT_STAGE;
  } else {
    return (context && context.invokedFunctionArn) ? context.invokedFunctionArn.replace(/.*:/g, '') : 'dev';
  }
};
