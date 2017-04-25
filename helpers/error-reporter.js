const getStage = require('./get-stage');
const raygun = require('raygun');
const raygunClient = new raygun.Client().init({ apiKey: 't4ZsXM91R2CW+V5SfmxcrA==' });

module.exports = function addErrorReporter (request) {
  const stage = getStage(request.lambdaContext);

  if (stage !== 'uat') {
    return {};
  }

  if (!request.lambdaContext.awsRequestId) {
    return {};
  }

  console.log('Registering raygun handler');

  process.on('uncaughtException', function (err) {
    console.log('#uncaughtException', err);

    raygunClient.send(err);
  });

  // Not sure if this is the right way to do it
  // process.on('unhandledRejection', function (reason, p) {
  //   console.log('#unhandledRejection', reason, p);

  //   try {
  //     var err = new Error(`Possibly Unhandled Rejection at.\n\nPromise ${p}\n\nReason ${reason}`);
  //     throw err;
  //   } catch (err) {
  //     raygunClient.send(err);
  //   }
  // });

  // return some handlers, please refactor this class for sanity.
  return {
    catchPromise: (reason) => {
      console.log('Caught promise rejection');

      var err = new Error(`Possibly Unhandled Rejection.\n\nReason ${reason}`);

      const p = new Promise(function (resolve, reject) {
        console.log(raygunClient.send(err, {}, function () {
          console.log('Sent promise rejection');
          resolve();
        }));
      });

      return p;
    }
  };
};
