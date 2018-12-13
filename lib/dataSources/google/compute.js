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
};
