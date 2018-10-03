const _ = require('lodash');
const {cloudWatchNamespaceDetails} = require('./cloudwatch');
// namespaceDetails is what I'm calling the arguments to identify and initialize 
// a particular aws sdk class. for example:
//
//      const kinesis = new AWS[namespaceDetails.name](namespaceDetails.constructorArgs);
const namespaceDetails = {
  name: 'Kinesis',
  constructorArgs: {
  },
};

const kinesisStreams = {
  dataSource: 'AWS',
  name: 'kinesisStreams',
  namespaceDetails,
  value: {
    path: 'StreamNames',
  },
  apiMethod: 'listStreams',
  params: {
    Limit: 100,
  },
  incompleteIndicator: 'HasMoreStreams',
  nextBatchParamConstructor: (params, streams) => {
    return _.merge(params, {
      ExclusiveStartStreamName: streams.StreamNames[streams.StreamNames.length - 1]
    });
  }
};

const kinesisStream = {
  dataSource: 'AWS',
  name: 'kinesisStream',
  namespaceDetails,
  value: {
    path: 'StreamDescription',
  },
  apiMethod: 'describeStream',
  params: {
  },
  requiredParams: {
    StreamName: {
      defaultSource: kinesisStreams
    }
  },
  incompleteIndicator: 'StreamDescription.HasMoreShards',
  nextBatchParamConstructor: (params, stream) => {
    const lastShardIndex = stream.StreamDescription.Shards.length - 1;
    const lastShardId = stream.StreamDescription.Shards[lastShardIndex].shardId;
    return _.merge(params, {ExclusiveStartShardId: lastShardId});
  },
  mergeOperator: (stream1, stream2) => {
    stream2.StreamDescription.Shards = [].concat(
      stream1.StreamDescription.Shards,
      stream2.StreamDescription.Shards
    );
  }
};

const kinesisStreamMetrics = {
  dataSource: 'AWS',
  name: 'kinesisStreamMetrics',
  namespaceDetails: cloudWatchNamespaceDetails,
  value: {
    path: 'Datapoints',
  },
  apiMethod: 'getMetricStatistics',
  params: {
    Namespace: 'AWS/Kinesis',
    Period: 60,
  },
  requiredParams: {
    Statistics: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    MetricName: {
    },
    Dimensions: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
    },
    StartTime: {
    },
    EndTime: {
    }
  }
};

function streamMetricHourBuilder(apiConfig, metricName, streamName) {
  return {
    accessSchema: kinesisStreamMetrics,
    params: {
      StartTime: {
        generate: () => {return new Date(Date.now() - (1000 * 60 * 60)).toISOString();},
      },
      EndTime: {
        generate: () => {return new Date().toISOString();},
      },
      MetricName: {
        value: metricName
      },
      Statistics: {
        value: ['Sum']
      },
      Dimensions: {
        value: [{Name: 'StreamName', Value: streamName}]
      },
      apiConfig: {value: apiConfig},
    },
  };
}

module.exports = {
  kinesisStream,
  streamMetricHourBuilder,
  kinesisStreamMetrics,
  kinesisStreams
};
