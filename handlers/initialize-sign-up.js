const addErrorReporter = require('../helpers/error-reporter');
const generateDeviceKey = require('../operations/generate-device-key');

exports.handler = (request) => {
  addErrorReporter(request);

  return {
    success: true,
    deviceKey: generateDeviceKey()
  };
};
