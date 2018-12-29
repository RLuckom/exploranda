const _ = require('lodash');

const namespaceDetails = {
  name: 'iam',
  constructorArgs: {
    version: 'v1'
  }
};

const serviceAccounts = {
  dataSource: 'GOOGLE',
  name: 'serviceAccounts',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.accounts');
    },
  },
  apiMethod: ['projects', 'serviceAccounts', 'list'],
  params: {},
  requiredParams: {
    name: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function serviceAccountsBuilder(apiConfig, name) {
  return {
    accessSchema: serviceAccounts,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

const serviceAccount = {
  dataSource: 'GOOGLE',
  name: 'serviceAccount',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data');
    },
  },
  apiMethod: ['projects', 'serviceAccounts', 'get'],
  params: {},
  requiredParams: {
    name: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function serviceAccountBuilder(apiConfig, name) {
  return {
    accessSchema: serviceAccount,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

const serviceAccountKeys = {
  dataSource: 'GOOGLE',
  name: 'serviceAccountKeys',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.keys');
    },
  },
  apiMethod: ['projects', 'serviceAccounts', 'keys', 'list'],
  params: {},
  requiredParams: {
    name: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function serviceAccountKeysBuilder(apiConfig, name) {
  return {
    accessSchema: serviceAccountKeys,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

const serviceAccountKey = {
  dataSource: 'GOOGLE',
  name: 'serviceAccountKey',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data');
    },
  },
  apiMethod: ['projects', 'serviceAccounts', 'keys', 'get'],
  params: {},
  requiredParams: {
    name: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function serviceAccountKeyBuilder(apiConfig, name) {
  return {
    accessSchema: serviceAccountKey,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

module.exports = {
  serviceAccount, serviceAccountBuilder, serviceAccounts, serviceAccountsBuilder,
  serviceAccountKey, serviceAccountKeyBuilder, serviceAccountKeys, serviceAccountKeysBuilder
};
