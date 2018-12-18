const _ = require('lodash');

const namespaceDetails = {
  name: 'sqladmin',
  constructorArgs: {
    version: 'v1beta4'
  }
};

const sqlInstances = {
  dataSource: 'GOOGLE',
  name: 'sqlInstances',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['instances', 'list'],
  params: {},
  requiredParams: {
    project: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function sqlInstancesBuilder(apiConfig, project) {
  return {
    accessSchema: sqlInstances,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

module.exports = {
  sqlInstances, sqlInstancesBuilder,
};
