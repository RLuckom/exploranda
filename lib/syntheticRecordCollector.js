const _ = require('lodash');

function transform({transformation}, params, callback) {
  return setTimeout(() => {
    try {
      callback(null, transformation(params));
    } catch(err) {
      callback(err);
    }
  }, 0);
}

module.exports = {
  transform
};
