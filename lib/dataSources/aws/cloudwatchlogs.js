const _ = require('lodash');
const cloudWatchLogsNamespaceDetails = {
  name: 'CloudWatchLogs',
  constructorArgs: {
  }
};

// This intentionally doesn't set the incompleteIndicator
// field, because the intent is not to get _all_ the log streams.
// A potential improvenemt would be to allow the incompleteIndicator
// to be a function, so that you could write a function to return
// true until you had all the log streams you wanted
const mostRecentLogStreamsInLogGroup = {
  dataSource: 'AWS',
  name: 'mostRecentLogStreamsInLogGroup',
  namespaceDetails: cloudWatchLogsNamespaceDetails,
  value: {
    path: 'logStreams',
  },
  apiMethod: 'describeLogStreams',
  params: {
    limit: 50,
    descending: true,
    orderBy: 'LastEventTime'
  },
  requiredParams: {
    logGroupName: {
    }
  },
  mergeIndividual: _.identity
};

// see note on mostrecentlogstreams.
const mostRecentEventsInLogStream = {
  dataSource: 'AWS',
  name: 'mostRecentLogStreamsInLogGroup',
  namespaceDetails: cloudWatchLogsNamespaceDetails,
  value: {
    path: 'events',
  },
  apiMethod: 'getLogEvents',
  params: {
    limit: 150,
  },
  requiredParams: {
    logGroupName: {
    },
    logStreamName: {
    }
  }
};

const describeLogGroups = {
  dataSource: 'AWS',
  name: 'describeLogGroups',
  namespaceDetails: cloudWatchLogsNamespaceDetails,
  value: {
    path: 'logGroups',
  },
  apiMethod: 'describeLogGroups',
  params: {},
  requiredParams: {},
  incompleteIndicator: 'nextToken',
  nextBatchParamConstructor: (params, {nextToken}) => {
    return _.merge({}, params, {nextToken});
  },
};

function mostRecentEventsBuilder(apiConfig, groupName, streamNamePart, streamsDependencyName) {
  return {
    accessSchema: mostRecentEventsInLogStream,
    params: {
      logGroupName: {
        value: groupName,
      },
      logStreamName: {
        source: streamsDependencyName,
        formatter: (streams) => {
          return _.find(_.flatten(streams), (s) => s.logStreamName.indexOf(streamNamePart) !== -1).logStreamName;
        }
      },
      apiConfig: {value: apiConfig},
    }
  };
}

function mostRecentStreamsInGroupBuilder(apiConfig, groupName) {
  return {
    accessSchema: mostRecentLogStreamsInLogGroup,
    params: {
      logGroupName: {
        value: groupName, 
      },
      apiConfig: {value: apiConfig},
    }
  };
}

function describeLogGroupsBuilder(apiConfig) {
  return {
    accessSchema: describeLogGroups,
    params: {apiConfig: {value: apiConfig}}
  };
}

module.exports = {
  describeLogGroups,
  describeLogGroupsBuilder,
  mostRecentStreamsInGroupBuilder,
  mostRecentEventsBuilder,
  cloudWatchLogsNamespaceDetails,
  mostRecentLogStreamsInLogGroup,
  mostRecentEventsInLogStream
};
