const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();

/**
 * Helper for API errors with structured data,
 * e.g. user-facing error messages
 */
class ApiError extends Error {
  constructor (message, data = {}) {
    super(message);
    this.statusCode = data.statusCode || 400;
    this.data = {};
  }

  getResponse () {
    const body = Object.assign(
      {},
      this.data,
      {message: this.message}
    );
    return new api.ApiResponse(
      JSON.stringify(body),
      {'Content-Type': 'application/javascript'},
      this.statusCode
    );
  }
}

ApiError.getDefaultResponse = () => {
  const body = {message: 'There has been an error'};
  return new api.ApiResponse(
    JSON.stringify(body),
    {'Content-Type': 'application/javascript'},
    500
  );
};

module.exports = ApiError;
