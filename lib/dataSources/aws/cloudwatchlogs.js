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
  }
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
    limit: 50,
  },
  requiredParams: {
    logGroupName: {
    },
    logStreamName: {
    }
  }
};

function mostRecentEventsBuilder(awsConfig, groupName, streamNamePart, streamsDependencyName) {
  return {
    accessSchema: mostRecentEventsInLogStream,
    params: {
      logGroupName: {
        value: groupName,
      },
      logStreamName: {
        source: streamsDependencyName,
        formatter: (streams) => {
          return _.find(streams, (s) => s.logStreamName.indexOf(streamNamePart) !== -1).logStreamName;
        }
      },
      awsConfig: {value: awsConfig},
    }
  };
}

function mostRecentStreamsInGroupBuilder(awsConfig, groupName) {
  return {
    accessSchema: mostRecentLogStreamsInLogGroup,
    params: {
      logGroupName: {
        value: groupName, 
      },
      awsConfig: {value: awsConfig},
    }
  };
}

module.exports = {
  mostRecentStreamsInGroupBuilder,
  mostRecentEventsBuilder,
  cloudWatchLogsNamespaceDetails,
  mostRecentLogStreamsInLogGroup,
  mostRecentEventsInLogStream
};
