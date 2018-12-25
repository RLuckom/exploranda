const _ = require('lodash');

function transform({transformation}, params, callback) {
  return setTimeout(() => {
    callback(null, transformation(params));
  }, 0);
}

module.exports = {
  transform
};
