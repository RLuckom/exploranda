const _ = require('lodash');
const {kinesisStreams, kinesisStream, kinesisStreamMetrics} = require('../../../lib/dataSources/aws/kinesis');
const {executeTestSuite, keys} = require('../composer.spec');

function initialization(namespace, region) {
  return {
    namespace,
    arguments: [_.merge({}, keys, {region})]
  };
}

function apiConfig() {
  return {value: _.merge({}, keys, {region: 'us-east-1'})};
}

function callParameters(method, args) {
  return {method, arguments: args};
}

function successfulKinesisCall(method, args, response, noInit) {
  return {
    initialization: initialization('Kinesis', 'us-east-1'),
    callParameters: callParameters(method, args),
    error: null,
    response,
    noInit
  };
}

function kinesisNamesDependency() {
  return {
    accessSchema: kinesisStreams,
    params: {
      apiConfig: apiConfig(),
    }
  };
}

function kinesisNamesMock() {
  return {
    source: 'AWS',
    sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']}),
    expectedValue: ['foo', 'bar', 'baz']
  };
}

function requestDependency() {
  return {
    accessSchema: {
      dataSource: 'REQUEST',
      params: {
        shouldBeOverridden: 'should not appear',
      },
      generateRequest: (params) => {
        expect(params).toEqual({shouldBeOverridden: 'correct'});
        return {StreamNames: ['bar']};
      }
    },
    params: {
      shouldBeOverridden: {value: 'correct'}
    }
  };
}

function requestMock() {
  return {
    source: 'REQUEST',
    sourceConfig: {
      error: null,
      response: {statusCode: '200'},
      body: {StreamNames: ['qux']},
      callParameters: [{StreamNames: ['bar']}]
    },
    expectedValue: {StreamNames: ['qux']}
  };
}

const basicAwsTestCase = {
  name: 'Basic Single-AWS-request case',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency()
  },
  namedMocks: {
    kinesisNames: kinesisNamesMock(),
  },
};

const incompleteRequestAwsTestCase = {
  name: 'Multiple-request AWS dependency',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency()
  },
  namedMocks: {
    kinesisNames: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('listStreams', [{Limit: 100}], {HasMoreStreams: true, StreamNames: ['foo', 'bar', 'baz']}),
        successfulKinesisCall('listStreams', [{Limit: 100, ExclusiveStartStreamName: 'baz'}], {StreamNames: ['qux', 'quux', 'quuux']}, true),
      ],
      expectedValue: ['foo', 'bar', 'baz', 'qux', 'quux', 'quuux']
    }
  },
};

const requestOnlyTestCase = {
  name: 'Request-only test case',
  dataDependencies: {
    request: requestDependency(),
  },
  namedMocks: {
    request: requestMock()
  },
};

const requestAndOneStreamTestCase = {
  name: 'Request and one stream test case',
  dataDependencies: {
    request: requestDependency(),
    kinesisStream: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {
          source: 'request',
          formatter: (x) => x.StreamNames[0]
        },
        StreamName1: {
          source: 'request',
          formatter: (x) => x.StreamNames[0]
        },
        apiConfig: apiConfig(),
      }
    },
  },
  namedMocks: {
    kinesisStream: {
      source: 'AWS',
      sourceConfig: successfulKinesisCall('describeStream', [{StreamName: 'qux', StreamName1: 'qux'}], {StreamDescription: {StreamName: 'quxStream'}}),
      expectedValue: [{StreamName: 'quxStream'}]
    },
    request: requestMock()
  },
};

const doubleSourceUseTestCase = {
  name: 'Basic Single-AWS-request case',
  dataDependencies: {
    kinesisStreams1: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {source: 'kinesisNames'},
        apiConfig: apiConfig(),
      }
    },
    kinesisStreams2: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {source: 'kinesisNames'},
        apiConfig: apiConfig(),
      }
    },
    kinesisNames: kinesisNamesDependency(),
  },
  namedMocks: {
    kinesisNames: kinesisNamesMock(),
    kinesisStreams1: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    },
    kinesisStreams2: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
};

const basicAwsWithFormatter = {
  name: 'Basic Single-AWS-request case, with a formatter',
  dataDependencies: {
    kinesisNames: {
      accessSchema: kinesisStreams,
      params: {
        apiConfig: apiConfig(),
      },
      formatter: (ar) => ar[0]
    }
  },
  namedMocks: {
    kinesisNames: {
      source: 'AWS',
      sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']}),
      expectedValue: 'foo'
    }
  },
  implicitMocks: []
};

const basicAwsWithGenerator = {
  name: 'Basic Single-AWS-request case, with a formatter',
  dataDependencies: {
    kinesisNames: {
      accessSchema: kinesisStreams,
      params: {
        apiConfig: apiConfig(),
      },
    }
  },
  namedMocks: {
    kinesisNames: {
      source: 'AWS',
      sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']}),
      expectedValue: ['foo', 'bar', 'baz']
    }
  },
  implicitMocks: []
};

const doubleSourceTestCase = {
  name: 'Double source test case',
  dataDependencies: {
    jpl: {
      accessSchema: kinesisStream,
      params: {
        apiConfig: apiConfig(),
        StreamName: {
          value: 'jpl'
        }
      }
    },
    mpls: {
      accessSchema: kinesisStream,
      params: {
        apiConfig: apiConfig(),
        StreamName: {
          value: 'mpls'
        }
      }
    },
    multiSource: {
      accessSchema: kinesisStream,
      params: {
        apiConfig: apiConfig(),
        StreamName: {
          source: ['mpls', 'jpl'],
          formatter: (mpls, jpl) => `${mpls[0].StreamName}-${jpl[0].StreamName}`
        }
      }
    }
  },
  namedMocks: {
    jpl: { 
      source: 'AWS',
      sourceConfig: successfulKinesisCall('describeStream', [{StreamName: 'jpl'}], {StreamDescription: {StreamName: 'jplStream'}}),
      expectedValue: [{StreamName: 'jplStream'}]
    },
    mpls: { 
      source: 'AWS',
      sourceConfig: successfulKinesisCall('describeStream', [{StreamName: 'mpls'}], {StreamDescription: {StreamName: 'mplsStream'}}),
      expectedValue: [{StreamName: 'mplsStream'}]
    },
    multiSource: { 
      source: 'AWS',
      sourceConfig: successfulKinesisCall('describeStream', [{StreamName: 'mplsStream-jplStream'}], {StreamDescription: {StreamName: 'multiSourceStream'}}),
      expectedValue: [{StreamName: 'multiSourceStream'}]
    },
  }
};

const dependentAwsTestCase = {
  name: 'Basic dependent-AWS-request case',
  dataDependencies: {
    kinesisName: {
      accessSchema: kinesisStream,
      params: {
        apiConfig: apiConfig(),
      }
    }
  },
  namedMocks: {
    kinesisName: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
  implicitMocks: [
    kinesisNamesMock(),
  ]
};

const awsWithParamFormatter = {
  name: 'Basic Single-AWS-request case, with a param formatter',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(),
    kinesisStreams: {
      accessSchema: kinesisStream,
      params: {
        apiConfig: apiConfig(),
        StreamName: {
          source: 'kinesisNames',
          formatter: (names) => _.filter(names, (n) => n[0] === 'b')
        }
      }
    }
  },
  namedMocks: {
    kinesisNames: kinesisNamesMock(),
    kinesisStreams: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
      ],
      expectedValue: _.map(['bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
  implicitMocks: []
};

const testCases = [
  basicAwsTestCase,
  basicAwsWithGenerator,
  requestAndOneStreamTestCase,
  basicAwsWithFormatter,
  awsWithParamFormatter,
  dependentAwsTestCase,
  doubleSourceTestCase,
  doubleSourceUseTestCase,
  incompleteRequestAwsTestCase,
  requestOnlyTestCase
];

executeTestSuite('Basic report tests', testCases);
