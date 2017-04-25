const jwt = require('jsonwebtoken');
const yargs = require('yargs')
  .usage('Usage: $0 -token [token]')
  .demandOption(['token'])
  .argv;

console.log(JSON.stringify(jwt.decode(yargs.token)));
