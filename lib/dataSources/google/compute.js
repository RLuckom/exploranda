const _ = require('lodash');

const namespaceDetails = {
  name: 'compute',
  constructorArgs: {
    version: 'v1'
  }
};

const instances = {
  dataSource: 'GOOGLE',
  name: 'googleComputeInstances',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['instances', 'list'],
  params: {},
  requiredParams: {
    project: {},
    zone: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function instancesBuilder(apiConfig, project, zone) {
  return {
    accessSchema: instances,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      zone: {value: zone}
    }
  };
}

module.exports = {
  instances, instancesBuilder
};
