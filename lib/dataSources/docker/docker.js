const _ = require('lodash');

const dockerAuth = {
  dataSource: 'DOCKER',
  name: 'dockerAuth',
  value: {
    path: _.identity
  },
  requiredParams: {
  }
};

function dockerApiAccessSchemaBuilderGenerator(name, required, defaults) {
  return function() {
    const args = Array.prototype.slice.call(arguments);
    return {
      accessSchema: {
        dataSource: 'DOCKER',
        name,
        requiredParams: _.reduce(required, (acc, n) => {
          acc[n] = {};
          return acc;
        }, {}),
        params: defaults
      },
      params: _.fromPairs(_.zip(required, args))
    };
  }
}

module.exports = {
  dockerAuth,
  authBuilder: dockerApiAccessSchemaBuilderGenerator('dockerAuth', ['host', 'apiMethod', '?scope', '?service']),
  tagsBuilder: dockerApiAccessSchemaBuilderGenerator('dockerTags', ['host', 'apiMethod', 'apiConfig'])
};
