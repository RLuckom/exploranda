const _ = require('lodash');
const {cloudWatchNamespaceDetails} = require('./cloudwatch');

const EC2NamespaceDetails = {
  name: 'EC2',
  constructorArgs: {
  }
};

const instances = {
  dataSource: 'AWS',
  name: 'ec2Instances',
  namespaceDetails: EC2NamespaceDetails,
  value: {
    path: ({Reservations}) => _.flatten(_.map(Reservations, 'Instances')),
  },
  apiMethod: 'describeInstances',
  params: {},
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, clusters) => {
    return _.merge(params, {
      nextToken: clusters.nextToken
    });
  }
};

const amisById = {
  dataSource: 'AWS',
  name: 'ec2AMIs',
  namespaceDetails: EC2NamespaceDetails,
  value: {
    path: 'Images',
  },
  apiMethod: 'describeImages',
  params: {},
  requiredParams: {
    ImageIds: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    }
  },
};

const filteredInstances = {
  dataSource: 'AWS',
  name: 'filteredEc2Instances',
  namespaceDetails: EC2NamespaceDetails,
  value: {
    path: ({Reservations}) => _.flatten(_.map(Reservations, 'Instances')),
  },
  apiMethod: 'describeInstances',
  params: {},
  requiredParams: {
    Filters: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    }
  },
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, clusters) => {
    return _.merge(params, {
      nextToken: clusters.nextToken
    });
  }
};

const ec2Metrics = {
  dataSource: 'AWS',
  name: 'EC2Metrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
    sortBy: 'Timestamp',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    Namespace: 'AWS/EC2',
    Period: 60,
  },
  requiredParams: {
    MetricName: {
    },
    Statistics: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    Dimensions: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    StartTime: {
    },
    EndTime: {
    }
  },
  mergeIndividual: _.identity
};

function instancesBuilder(awsConfig) {
  return {
    accessSchema: instances,
    params: {
      awsConfig: {value: awsConfig},
    }
  };
}

function ec2MetricsBuilder(awsConfig, metricName, statistics, dimensions) {
  return {
    accessSchema: ec2Metrics,
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

function filteredInstancesBuilder(awsConfig, filterParam) {
  return {
    accessSchema: filteredInstances,
    params: {
      Filters: filterParam,
      awsConfig: {value: awsConfig},
    }
  };
}

function imagesByIdsBuilder(awsConfig, idParamDescription) {
  return {
    accessSchema: amisById,
    params: {
      ImageIds: idParamDescription,
      awsConfig: {value: awsConfig},
    }
  };
}

module.exports = {
  instances,
  instancesBuilder,
  filteredInstances, filteredInstancesBuilder,
  imagesByIdsBuilder,
  amisById,
  ec2Metrics, ec2MetricsBuilder
};
