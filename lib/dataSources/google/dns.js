const _ = require('lodash');

const namespaceDetails = {
  name: 'dns',
  constructorArgs: {
    version: 'v1'
  }
};

const zones = {
  dataSource: 'GOOGLE',
  name: 'managedZones',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.managedZones') || [];
    },
  },
  apiMethod: ['managedZones', 'list'],
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

function zonesBuilder(apiConfig, project) {
  return {
    accessSchema: zones,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const recordSets = {
  dataSource: 'GOOGLE',
  name: 'recordSets',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.rrsets') || [];
    },
  },
  apiMethod: ['resourceRecordSets', 'list'],
  params: {},
  requiredParams: {
    project: {},
    managedZone: {},
  },
  incompleteIndicator: 'nextPageToken',
  mergeIndividual: _.identity,
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function recordsBuilder(apiConfig, project, managedZone) {
  return {
    accessSchema: zones,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      managedZone,
    }
  };
}

module.exports = {
  zones, zonesBuilder, recordSets
};
