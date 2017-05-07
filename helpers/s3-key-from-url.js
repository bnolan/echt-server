const url = require('url');

/**
 * Returns the S3 object key from a S3 URL,
 * based on some assumptions about S3 URL formatting.
 *
 * @param {String}
 * @return {String}
 */
module.exports = (s3url) => {
  const urlObj = url.parse(s3url);
  // URL paths start with a leading slash
  return urlObj ? urlObj.path.split('/').slice(2).join('/') : null;
};
