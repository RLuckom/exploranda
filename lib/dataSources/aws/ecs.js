const _ = require('lodash');
const {cloudWatchNamespaceDetails} = require('./cloudwatch');

const ECSNamespaceDetails = {
  name: 'ECS',
  constructorArgs: {
  }
};

const clusters = {
  dataSource: 'AWS',
  name: 'ecsClusterArns',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'clusterArns',
  },
  apiMethod: 'listClusters',
  params: {
    maxResults: 100,
  },
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, clusters) => {
    return _.merge(params, {
      nextToken: clusters.nextToken
    });
  }
};

const cluster = {
  dataSource: 'AWS',
  name: 'cluster',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'clusters',
  },
  apiMethod: 'describeClusters',
  requiredParams: {
    clusters: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
      defaultSource: clusters
    }
  },
};

const serviceArnsByCluster = {
  dataSource: 'AWS',
  name: 'serviceArnsByCluster',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'serviceArns',
  },
  apiMethod: 'listServices',
  params: {
    maxResults: 100,
  },
  requiredParams: {
    cluster: {
      defaultSource: clusters
    }
  },
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, clusters) => {
    return _.merge({}, params, {
      nextToken: clusters.nextToken
    });
  }
};

const servicesByClusterAndArnArray = {
  dataSource: 'AWS',
  name: 'servicesByClusterAndArnArray',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'services',
  },
  apiMethod: 'describeServices',
  requiredParams: {
    cluster: {
    },
    services: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
      max: 10
    }
  }
};

const tasksByCluster = {
  dataSource: 'AWS',
  name: 'tasks',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'taskArns',
  },
  apiMethod: 'listTasks',
  params: {
    maxResults: 100,
  },
  requiredParams: {
    cluster: {
      type: 'ClusterArn',
      defaultSource: clusters
    }
  }
};

const containerInstanceArnsByCluster = {
  dataSource: 'AWS',
  name: 'containerInstanceArnsByCluster',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'containerInstanceArns',
  },
  apiMethod: 'listContainerInstances',
  params: {},
  requiredParams: {
    cluster: {
      type: 'cluster',
      defaultSource: clusters
    }
  },
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, clusters) => {
    return _.merge({}, params, {
      nextToken: clusters.nextToken
    });
  }
};

const containerInstancesByCluster = {
  dataSource: 'AWS',
  name: 'containerInstancesByCluster',
  namespaceDetails: ECSNamespaceDetails,
  value: {
    path: 'containerInstances',
  },
  apiMethod: 'describeContainerInstances',
  params: {},
  requiredParams: {
    cluster: {
    },
    containerInstances: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    }
  }
};

const serviceCPUUtilizationMetrics = {
  dataSource: 'AWS',
  name: 'serviceCPUUtilizationMetrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
    sortBy: 'Timestamp',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/ECS',
    Period: 60,
    Statistics: ['Average', 'Maximum']
  },
  requiredParams: {
    Dimensions: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    StartTime: {
    },
    EndTime: {
    }
  }
};

const serviceMemoryUtilizationMetrics = {
  dataSource: 'AWS',
  name: 'serviceMemoryUtilizationMetrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
    sortBy: 'Timestamp',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    MetricName: 'MemoryUtilization',
    Namespace: 'AWS/ECS',
    Period: 60,
    Statistics: ['Average', 'Maximum']
  },
  requiredParams: {
    Dimensions: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    StartTime: {
    },
    EndTime: {
    }
  }
};

const ecsMetrics = {
  dataSource: 'AWS',
  name: 'ecsMetrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
    sortBy: 'Timestamp',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    Namespace: 'AWS/ECS',
    Period: 60,
  },
  requiredParams: {
    Dimensions: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    MetricName: {},
    StartTime: {},
    EndTime: {},
    Statistics: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
  },
  mergeIndividual: _.identity
};

function ecsMetricsBuilder(awsConfig, metricName, statistics, dimensions) {
  return {
    accessSchema: ecsMetrics,
    params: {
      StartTime: {
        generate: () => {return new Date(Date.now() - (1000 * 60 * 60)).toISOString();},
      },
      EndTime: {
        generate: () => {return new Date().toISOString();},
      },
      MetricName: metricName,
      Dimensions: dimensions,
      Statistics: statistics,
      awsConfig: {value: awsConfig},
    }
  };
}

function clusterBuilder(awsConfig, clusters) {
  return {
    accessSchema: cluster,
    params: {
      clusters,
      awsConfig: {value: awsConfig},
    }
  };
}

function clusterServiceArnsBuilder(awsConfig, cluster) {
  return {
    accessSchema: serviceArnsByCluster,
    params: {
      cluster,
      awsConfig: {value: awsConfig},
    }
  };
}

function clusterContainerInstanceArnsBuilder(awsConfig, cluster) {
  return {
    accessSchema: containerInstanceArnsByCluster,
    params: {
      cluster,
      awsConfig: {value: awsConfig},
    }
  };
}

function containerInstancesByClusterBuilder(awsConfig, cluster, containerInstances) {
  return {
    accessSchema: containerInstancesByCluster,
    params: {
      cluster,
      containerInstances,
      awsConfig: {value: awsConfig},
    }
  };
}
  
function servicesInClusterBuilder(awsConfig, cluster, services) {
  return {
    accessSchema: servicesByClusterAndArnArray,
    params: {
      cluster,
      services,
      awsConfig: {value: awsConfig},
    },
  };
}

function clusterMemoryMetricsHourBuilder(awsConfig, dimensions) {
  return {
    accessSchema: serviceMemoryUtilizationMetrics,
    params: {
      StartTime: {
        generate: () => {return new Date(Date.now() - (1000 * 60 * 60)).toISOString();},
      },
      EndTime: {
        generate: () => {return new Date().toISOString();},
      },
      Dimensions: dimensions,
      awsConfig: {value: awsConfig},
    }
  };
}

function clusterCPUMetricsHourBuilder(awsConfig, dimensions) {
  return {
    accessSchema: serviceCPUUtilizationMetrics,
    params: {
      StartTime: {
        generate: () => {return new Date(Date.now() - (1000 * 60 * 60)).toISOString();},
      },
      EndTime: {
        generate: () => {return new Date().toISOString();},
      },
      Dimensions: dimensions,
      awsConfig: {value: awsConfig},
    }
  };
}

module.exports = {
  clusterBuilder,
  clusterServiceArnsBuilder,
  servicesInClusterBuilder,
  containerInstanceArnsByCluster, clusterContainerInstanceArnsBuilder,
  containerInstancesByCluster, containerInstancesByClusterBuilder,
  clusterCPUMetricsHourBuilder,
  clusterMemoryMetricsHourBuilder,
  clusters,
  cluster,
  ecsMetrics, ecsMetricsBuilder,
  serviceArnsByCluster,
  serviceCPUUtilizationMetrics,
  serviceMemoryUtilizationMetrics,
  servicesByClusterAndArnArray
};
