const _ = require('lodash');

const namespaceDetails = {
  name: 'container',
  constructorArgs: {
    version: 'v1'
  }
};

const clusters = {
  dataSource: 'GOOGLE',
  name: 'googleContainerClusters',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'clusters', 'list'],
  params: {},
  requiredParams: {
    parent: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function clustersBuilder(apiConfig, parent) {
  return {
    accessSchema: clusters,
    params: {
      apiConfig: {value: apiConfig},
      parent,
    }
  };
}

const cluster = {
  dataSource: 'GOOGLE',
  name: 'googleContainerCluster',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'clusters', 'get'],
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

function clusterBuilder(apiConfig, name) {
  return {
    accessSchema: cluster,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

const nodePools = {
  dataSource: 'GOOGLE',
  name: 'googleContainerNodePools',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'clusters', 'nodePools', 'list'],
  params: {},
  requiredParams: {
    parent: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function nodePoolsBuilder(apiConfig, parent) {
  return {
    accessSchema: nodePools,
    params: {
      apiConfig: {value: apiConfig},
      parent,
    }
  };
}

const nodePool = {
  dataSource: 'GOOGLE',
  name: 'googleContainerNodePool',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'clusters', 'nodePools', 'get'],
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

function nodePoolBuilder(apiConfig, name) {
  return {
    accessSchema: nodePool,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

const operations = {
  dataSource: 'GOOGLE',
  name: 'googleContainerOperations',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'operations', 'list'],
  params: {},
  requiredParams: {
    parent: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function operationsBuilder(apiConfig, parent) {
  return {
    accessSchema: operations,
    params: {
      apiConfig: {value: apiConfig},
      parent,
    }
  };
}

const operation = {
  dataSource: 'GOOGLE',
  name: 'googleContainerOperation',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['projects', 'locations', 'operations', 'get'],
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

function operationBuilder(apiConfig, name) {
  return {
    accessSchema: operation,
    params: {
      apiConfig: {value: apiConfig},
      name,
    }
  };
}

module.exports = {
  cluster, clusterBuilder, clusters, clustersBuilder, nodePool, nodePoolBuilder,
  nodePools, nodePoolsBuilder, operation, operationBuilder, operations, operationsBuilder,
};
