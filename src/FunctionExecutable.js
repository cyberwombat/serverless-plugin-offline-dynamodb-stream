const { Writable } = require('stream');
const executeFunctions = require('./executeFunctions');

const FunctionExecutable = (location, functions, table) =>
  new Writable({
    write(chunk = [], encoding, callback) {
      executeFunctions(chunk, location, functions, table).then(() => {
        callback();
      });
    },
    objectMode: true
  });

module.exports = FunctionExecutable;
