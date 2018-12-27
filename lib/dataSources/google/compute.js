const _ = require('lodash');

const alphaNamespaceDetails = {
  name: 'compute',
  constructorArgs: {
    version: 'alpha'
  }
};

const networkIpAddresses = {
  dataSource: 'GOOGLE',
  name: 'googleComputeNetwork',
  namespaceDetails: alphaNamespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['networks', 'listIpAddresses'],
  params: {},
  requiredParams: {
    project: {},
    network: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function networkIpAddressesBuilder(apiConfig, project, network) {
  return {
    accessSchema: networkIpAddresses,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      network,
    }
  };
}

const networkIpOwners = {
  dataSource: 'GOOGLE',
  name: 'googleComputeNetwork',
  namespaceDetails: alphaNamespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['networks', 'listIpOwners'],
  params: {},
  requiredParams: {
    project: {},
    network: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function networkIpOwnersBuilder(apiConfig, project, network) {
  return {
    accessSchema: networkIpOwners,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      network,
    }
  };
}

const namespaceDetails = {
  name: 'compute',
  constructorArgs: {
    version: 'v1'
  }
};

const networks = {
  dataSource: 'GOOGLE',
  name: 'googleComputeNetworks',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['networks', 'list'],
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

function networksBuilder(apiConfig, project) {
  return {
    accessSchema: networks,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const network = {
  dataSource: 'GOOGLE',
  name: 'googleComputeNetwork',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data') || [];
    },
  },
  apiMethod: ['networks', 'get'],
  params: {},
  requiredParams: {
    project: {},
    network: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function networkBuilder(apiConfig, project, n) {
  return {
    accessSchema: network,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      network: n,
    }
  };
}

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

const instanceGroups = {
  dataSource: 'GOOGLE',
  name: 'googleComputeBackendInstanceGroups',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['instanceGroups', 'list'],
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

function instanceGroupsBuilder(apiConfig, project, zone) {
  return {
    accessSchema: instanceGroups,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      zone: {value: zone},
    }
  };
}

const instanceGroupListInstances = {
  dataSource: 'GOOGLE',
  name: 'googleComputeInstanceGroupListInstances',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['instanceGroups', 'listInstances'],
  params: {},
  requiredParams: {
    project: {},
    zone: {},
    instanceGroup: {},
  },
  incompleteIndicator: 'nextPageToken',
  mergeIndividual: _.identity,
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

const backendServices = {
  dataSource: 'GOOGLE',
  name: 'googleComputeBackendServices',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['backendServices', 'list'],
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

function backendServicesBuilder(apiConfig, project) {
  return {
    accessSchema: backendServices,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const aggregatedBackendServices = {
  dataSource: 'GOOGLE',
  name: 'googleComputeAggregatedBackendServices',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['backendServices', 'aggregatedList'],
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

function aggregatedBackendServicesBuilder(apiConfig, project) {
  return {
    accessSchema: aggregatedBackendServices,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const urlMaps = {
  dataSource: 'GOOGLE',
  name: 'googleComputeUrlMaps',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['urlMaps', 'list'],
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

function urlMapsBuilder(apiConfig, project) {
  return {
    accessSchema: urlMaps,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const targetHttpsProxies = {
  dataSource: 'GOOGLE',
  name: 'googleComputetargetHttpsProxies',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['targetHttpsProxies', 'list'],
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

function targetHttpsProxiesBuilder(apiConfig, project) {
  return {
    accessSchema: targetHttpsProxies,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const targetHttpProxies = {
  dataSource: 'GOOGLE',
  name: 'googleComputetargetHttpProxies',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['targetHttpProxies', 'list'],
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

function targetHttpProxiesBuilder(apiConfig, project) {
  return {
    accessSchema: targetHttpProxies,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const globalForwardingRules = {
  dataSource: 'GOOGLE',
  name: 'googleComputeGlobalForwardingRules',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['globalForwardingRules', 'list'],
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

function globalForwardingRulesBuilder(apiConfig, project) {
  return {
    accessSchema: globalForwardingRules,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
    }
  };
}

const forwardingRules = {
  dataSource: 'GOOGLE',
  name: 'googleComputeForwardingRules',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.items') || [];
    },
  },
  apiMethod: ['forwardingRules', 'list'],
  params: {},
  requiredParams: {
    project: {},
    region: {},
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function forwardingRulesBuilder(apiConfig, project, region) {
  return {
    accessSchema: forwardingRules,
    params: {
      apiConfig: {value: apiConfig},
      project: {value: project},
      region: {value: region}
    }
  };
}

module.exports = {
  forwardingRules, forwardingRulesBuilder, urlMaps, urlMapsBuilder, backendServices, backendServicesBuilder, instanceGroups, instanceGroupsBuilder, instanceGroupListInstances,
  instances, instancesBuilder, globalForwardingRules, globalForwardingRulesBuilder, targetHttpProxies, targetHttpProxiesBuilder, targetHttpsProxies, targetHttpsProxiesBuilder,
  aggregatedBackendServices, aggregatedBackendServicesBuilder, network, networkBuilder, networks, networksBuilder, networkIpAddresses, networkIpAddressesBuilder,
  networkIpOwners, networkIpOwnersBuilder,
};
