const _ = require('lodash');

const namespaceDetails = {
  name: 'monitoring',
  constructorArgs: {
    version: 'v3'
  }
};

const timeSeries = {
  dataSource: 'GOOGLE',
  name: 'stackdriverTimeSeries',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.timeSeries') || [];
    },
  },
  apiMethod: ['projects', 'timeSeries', 'list'],
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

function timeSeriesBuilder(apiConfig, projectId, filter, aggregation, interval) {
  return {
    accessSchema: timeSeries,
    params: {
      apiConfig: {value: apiConfig},
      name: {value: `projects/${projectId}`},
      filter,
      'aggregation.alignmentPeriod':aggregation.alignmentPeriod,
      'aggregation.perSeriesAligner':aggregation.perSeriesAligner,
      'aggregation.groupByFields':aggregation.groupByFields,
      'aggregation.crossSeriesReducer':aggregation.crossSeriesReducer,
      'interval.startTime': interval.startTime,
      'interval.endTime': interval.endTime,
    }
  };
}

module.exports = {
  timeSeries, timeSeriesBuilder
};
