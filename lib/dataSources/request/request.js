const _ = require('lodash');

function simpleRequestDependencyBuilder(requestParams, ignoreErrors, defaultResponse, incomplete, mergeResponses, nextRequest) {
  return {
    accessSchema: {
      dataSource: 'REQUEST',
      generateRequest: () => requestParams,
      ignoreErrors,
    }
  };
}

module.exports = {simpleRequestDependencyBuilder};
