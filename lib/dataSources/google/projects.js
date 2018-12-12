const _ = require('lodash');

const namespaceDetails = {
  name: 'cloudresourcemanager',
  constructorArgs: {
    version: 'v1'
  }
};

const projects = {
  dataSource: 'GOOGLE',
  name: 'googleProject',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.projects') || [];
    },
  },
  apiMethod: ['projects', 'list'],
  params: {},
  requiredParams: {
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function projectsBuilder(apiConfig) {
  return {
    accessSchema: projects,
    params: {
      apiConfig: {value: apiConfig},
    }
  };
}

module.exports = {
  projects, projectsBuilder
};
