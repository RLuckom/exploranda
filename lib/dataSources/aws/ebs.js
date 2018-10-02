const _ = require('lodash');
const {cloudWatchNamespaceDetails} = require('./cloudwatch');

const ebsMetrics = {
  dataSource: 'AWS',
  name: 'EBSMetrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
    sortBy: 'Timestamp',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    Namespace: 'AWS/EBS',
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

function ebsMetricsBuilder(apiConfig, metricName, statistics, dimensions) {
  return {
    accessSchema: ebsMetrics,
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
      apiConfig: {value: apiConfig},
    }
  };
}

module.exports = {
  ebsMetrics, ebsMetricsBuilder
};
