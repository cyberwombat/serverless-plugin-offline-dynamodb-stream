const { isNil, isFunction, map } = require('lodash');
const requireWithoutCache = require('require-without-cache');

const promisify = (foo) =>
  new Promise((resolve, reject) => {
    foo((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

const createHandler = (location, fn) => {
  const originalEnv = Object.assign({}, process.env);
  process.env = Object.assign({}, originalEnv, fn.environment);

  const handler = requireWithoutCache(
    location + '/' + fn.handler.split('.')[0],
    require
  )[
    fn.handler
      .split('/')
      .pop()
      .split('.')[1]
  ];
  return (event, context = {}) =>
    promisify((cb) => {
      const maybeThennable = handler(event, context, cb);
      if (!isNil(maybeThennable) && isFunction(maybeThennable.then)) {
        maybeThennable
          .then((result) => {
            process.env = originalEnv;
            return cb(null, result);
          })
          .catch((err) => cb(err));
      }
    });
};

const executeFunctions = (events = [], location, functions, table) => {


  return Promise.all(
    map(functions, (fn) => {
      const handler = createHandler(location, fn);
      return handler({ Records: events.Records.map(record => {
        record.eventSourceARN  = `arn:aws:dynamodb:localhost:h000000000000:table/l/${table}`
        return record
      })});
    })
  );
};

module.exports = executeFunctions;
