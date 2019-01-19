const _ = require('lodash');
const {kinesisStreams, kinesisStream, kinesisStreamMetrics} = require('../../../lib/dataSources/aws/kinesis');
const vaultSecrets = require('../../../lib/dataSources/vault/secrets');
const elasticsearch = require('../../../lib/dataSources/elasticsearch/elasticsearch');
const {executeBasicTestSuite, executeCachingTestSuite, keys} = require('../composer.spec');

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

const kinesisStreamWithAnotherParam = {
  dataSource: 'AWS',
  name: 'kinesisStream',
  namespaceDetails: {
    name: 'Kinesis',
    constructorArgs: {}
  },
  value: {
    path: 'StreamDescription',
  },
  apiMethod: 'describeStream',
  params: {
  },
  requiredParams: {
    otherParam: {},
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

const kinesisStreamWithANonRequiredParam = {
  dataSource: 'AWS',
  name: 'kinesisStream',
  namespaceDetails: {
    name: 'Kinesis',
    constructorArgs: {}
  },
  value: {
    path: 'StreamDescription',
  },
  apiMethod: 'describeStream',
  params: {
  },
  optionalParams: {
    otherParam: {}
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

function kinesisNamesDependency(cacheLifetime) {
  return {
    accessSchema: kinesisStreams,
    cacheLifetime: cacheLifetime,
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

function twoRequestDependency() {
  return {
    accessSchema: {
      dataSource: 'REQUEST',
      params: {
        shouldBeOverridden: 'should not appear',
      },
      generateRequest: (params) => {
        expect(params).toEqual({shouldBeOverridden: 'correct'});
        return [{StreamNames: ['bar']}, {StreamNames: ['bax']}];
      }
    },
    params: {
      shouldBeOverridden: {value: 'correct'}
    }
  };
}

function twoRequestMock() {
  return {
    source: 'REQUEST',
    sourceConfig: [
    {
      error: null,
      response: {statusCode: '200'},
      body: {StreamNames: ['baz']},
      callParameters: [{StreamNames: ['bar']}]
    },
    {
      error: null,
      response: {statusCode: '200'},
      body: {StreamNames: ['qux']},
      callParameters: [{StreamNames: ['bax']}]
    },
    ],
    expectedValue: [{StreamNames: ['baz']}, {StreamNames: ['qux']}]
  };
}

const requestOnlyTestCase = {
  name: 'Request-only test case',
  dataDependencies: {
    request: requestDependency(),
  },
  namedMocks: {
    request: requestMock()
  },
};

const twoRequestAndOneSyntheticTestCase = {
  name: 'two request and one synthetic test case',
  dataDependencies: {
    request: twoRequestDependency(),
    synthetic: {
      accessSchema: {
        dataSource: 'SYNTHETIC',
        transformation: ({request}) => {
          return request.request[0];
        }
      },
      params: {request: {source: 'request'}}
    }
  },
  namedMocks: {
    request: twoRequestMock(),
    synthetic: {
      source: 'SYNTHETIC',
      expectedValue: {StreamNames: ['baz']}
    }
  },
};

const twoRequestTestCase = {
  name: 'two request test case',
  dataDependencies: {
    request: twoRequestDependency(),
  },
  namedMocks: {
    request: twoRequestMock()
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
          formatter: ({request}) => request.StreamNames[0]
        },
        StreamName1: {
          source: 'request',
          formatter: ({request}) => request.StreamNames[0]
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

const basicAwsTestCase = {
  name: 'Basic Single-AWS-request case',
  dataDependencies: {
    // add a cacheLifetime. This testt does not rely on caching.
    // It only makes one request. Adding a cacheLifetime should
    // mean that the result gets cached, which should not interfere
    // with the success of this test case.
    kinesisNames: kinesisNamesDependency(1000)
  },
  namedMocks: {
    kinesisNames: kinesisNamesMock(),
  },
};

const basicAwsCachingTestCase = {
  name: 'Single-source caching request case',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(1000)
  },
  phases: [
  {
    time: 0,
    preCache: {},
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
  },
  {
    time: 500,
    mocks: {},
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    }
  }]
};

const awsExpiringCacheTestCase = {
  name: 'Single-source get, get-from-cache, get',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(1000)
  },
  phases: [
  {
    time: 0,
    preCache: {},
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
  },
  {
    time: 500,
    mocks: {},
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    }
  },
  {
    time: 1500,
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'quux']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'quux']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'quux']}]
    },
  }
  ]
};

const awsCachedDependencyRequirementTestCase = {
  name: 'dependency found in cache',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(1000),
    kinesisNames1: kinesisNamesDependency(1000),
    kinesisStreams: {
      accessSchema: kinesisStream,
      cacheLifetime: 1000,
      params: {
        StreamName: {
          source: ['kinesisNames', 'kinesisNames1'],
          formatter: ({kinesisNames, kinesisNames1}) => kinesisNames1
        },
        falsyParam: {value: 0},
        falsyParam2: {value: false},
        falsyParam3: {value: null},
        falsyParam4: {value: ''},
        apiConfig: apiConfig(),
      }
    },
  },
  phases: [
  {
    time: 0,
    target: 'kinesisNames',
    preCache: {},
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
  },
  {
    time: 300,
    target: 'kinesisNames1',
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar']})
      }
    },
    expectedValues: {
      kinesisNames1: ['foo', 'bar']
    },
    postCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
  },
  {
    time: 500,
    mocks: {},
    target: ['kinesisNames'],
    preCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
    postCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
    expectedValues: {
      kinesisNames: ['foo'],
    }
  },
  {
    time: 700,
    mocks: {
      kinesisStreams: {
        source: 'AWS',
        sourceConfig: [
          successfulKinesisCall('describeStream', [{StreamName: 'foo', falsyParam: 0, falsyParam2: false, falsyParam3: null, falsyParam4: ''}], {StreamDescription: {StreamName: 'fooStream'}}),
          successfulKinesisCall('describeStream', [{StreamName: 'bar', falsyParam: 0, falsyParam2: false, falsyParam3: null, falsyParam4: ''}], {StreamDescription: {StreamName: 'barStream'}}),
        ]
      }
    },
    target: ['kinesisStreams'],
    preCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}]
    },
    postCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}],
      kinesisStreams: [
      {collectorArgs: {apiConfig: apiConfig().value, StreamName: ['foo', 'bar'], falsyParam: 0, falsyParam2: false, falsyParam3: null, falsyParam4: ''}, r: [{StreamName: 'fooStream'}, {StreamName: 'barStream'}]},
      ],
    },
    expectedValues: {
      kinesisNames: ['foo'],
      kinesisNames1: ['foo', 'bar'],
      kinesisStreams: [
      {StreamName: 'fooStream'},
      {StreamName: 'barStream'},
      ],
    }
  },
  {
    time: 900,
    mocks: {},
    target: 'kinesisStreams',
    preCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}],
      kinesisStreams: [
      {collectorArgs: {apiConfig: apiConfig().value, StreamName: ['foo', 'bar'], falsyParam: 0, falsyParam2: false, falsyParam3: null, falsyParam4: ''}, r: [{StreamName: 'fooStream'}, {StreamName: 'barStream'}]},
      ],
    },
    postCache: {
      kinesisNames1: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar']}],
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo']}],
      kinesisStreams: [
      {collectorArgs: {apiConfig: apiConfig().value, StreamName: ['foo', 'bar'], falsyParam: 0, falsyParam2: false, falsyParam3: null, falsyParam4: ''}, r: [{StreamName: 'fooStream'}, {StreamName: 'barStream'}]},
      ],
    },
    expectedValues: {
      kinesisNames: ['foo'],
      kinesisNames1: ['foo', 'bar'],
      kinesisStreams: [
      {StreamName: 'fooStream'},
      {StreamName: 'barStream'},
      ],
    }
  },
  ]
};

const vaultTreeTestCase = {
  name: 'Vault tree of requests test case',
  dataDependencies: {
    vaultKeys: {
      accessSchema: vaultSecrets.tree,
      params: {
        'X-Vault-Token' : {value: 'secretVaultToken'},
        apiConfig: {
          value: {
            path: 'secrets/foo/',
            host: 'www.example.com'
          }
        }
      }
    },
  },
  phases: [
  {
    time: 0,
    target: 'vaultKeys',
    preCache: {},
    mocks: {
      vaultKeys: {
        source: 'GENERIC_API',
        sourceConfig: [{
          callParameters: [{
            url: 'https://www.example.com/secrets/foo/',
            method: 'GET',
            qs: {list: true},
            headers: {
              'X-Vault-Token': 'secretVaultToken'
            },
            body: void(0),
            json: true,
          }],
          error: null,
          response: {statusCode: '200'},
          body: {data: {keys: ['bar/', 'baz/']}},
        }, {
          callParameters: [{
            url: 'https://www.example.com/secrets/foo/bar/',
            method: 'GET',
            qs: {list: true},
            headers: {
              'X-Vault-Token': 'secretVaultToken'
            },
            body: void(0),
            json: true,
          }],
          error: null,
          response: {statusCode: '200'},
          body: {data: {keys: ['qux', 'qux/']}},
        }, {
          callParameters: [{
            url: 'https://www.example.com/secrets/foo/baz/',
            method: 'GET',
            qs: {list: true},
            headers: {
              'X-Vault-Token': 'secretVaultToken'
            },
            body: void(0),
            json: true,
          }],
          error: null,
          response: {statusCode: '200'},
          body: {data: {keys: []}},
        }, {
          callParameters: [{
            url: 'https://www.example.com/secrets/foo/bar/qux/',
            method: 'GET',
            qs: {list: true},
            headers: {
              'X-Vault-Token': 'secretVaultToken'
            },
            body: void(0),
            json: true,
          }],
          error: null,
          response: {statusCode: '200'},
          body: {data: {keys: ['bax']}},
        }],
      }
    },
    expectedValues: {
      vaultKeys: [{
        'bar/': {
          qux: {__isSecret: true},
          'qux/': {
            bax: {
              __isSecret: true
            },
          }
        },
        'baz/': {}
      }],
    },
    postCache: {},
  },
  ]
};

const elasticsearchInputNoDefaultTestCase = {
  name: 'Elasticsearch input requests test case',
  dataDependencies: {
    elasticsearch: {
      accessSchema: elasticsearch.search,
      params: {
        'apikey' : {value: 'secretApiKey'},
        apiConfig: {
          value: {
            host: 'www.example.com'
          },
        },
        query: {
          input: 'esSearchQuery',
          formatter: ({esSearchQuery}) => {
            return {queryString: esSearchQuery};
          },
        },
      }
    },
  },
  phases: [
  {
    time: 0,
    target: 'elasticsearch',
    preCache: {},
    preInputs: {},
    inputs: {
      esSearchQuery: 'input1'
    },
    postInputs: {
      esSearchQuery: 'input1'
    },
    mocks: {
      elasticsearch: {
        source: 'GENERIC_API',
        sourceConfig: [{
          callParameters: [{
            url: 'https://www.example.com/_search',
            headers: {},
            qs: {apikey: 'secretApiKey'},
            body: {
              query: {queryString: 'input1'},
            },
            json: true,
            method: 'POST',
          }],
          error: null,
          response: {statusCode: '200'},
          body: {hits: {hits: ['bar', 'baz']}},
        }], 
      }
    },
    expectedValues: {
      elasticsearch: [{
        hits: {
          hits: ['bar', 'baz'],
        },
      }],
    },
    postCache: {},
  },
  ]
};

const elasticsearchInputTestCase = {
  name: 'Elasticsearch input requests test case',
  dataDependencies: {
    elasticsearch: {
      accessSchema: elasticsearch.search,
      params: {
        'apikey' : {value: 'secretApiKey'},
        apiConfig: {
          value: {
            host: 'www.example.com'
          },
        },
        query: {
          input: 'esSearchQuery',
          formatter: ({esSearchQuery}) => {
            return {queryString: esSearchQuery};
          },
        },
      }
    },
  },
  inputs: {
    esSearchQuery: 'input1',
  },
  phases: [
  {
    time: 0,
    target: 'elasticsearch',
    preCache: {},
    preInputs: {
      esSearchQuery: 'input1'
    },
    postInputs: {
      esSearchQuery: 'input1'
    },
    mocks: {
      elasticsearch: {
        source: 'GENERIC_API',
        sourceConfig: [{
          callParameters: [{
            url: 'https://www.example.com/_search',
            headers: {},
            qs: {apikey: 'secretApiKey'},
            body: {
              query: {queryString: 'input1'},
            },
            json: true,
            method: 'POST',
          }],
          error: null,
          response: {statusCode: '200'},
          body: {hits: {hits: ['bar', 'baz']}},
        }], 
      }
    },
    expectedValues: {
      elasticsearch: [{
        hits: {
          hits: ['bar', 'baz'],
        },
      }],
    },
    postCache: {},
  },
  {
    time: 300,
    target: 'elasticsearch',
    preCache: {},
    inputOverrides: {esSearchQuery: 'inputOverride'},
    preInputs: {
      esSearchQuery: 'input1'
    },
    postInputs: {
      esSearchQuery: 'input1'
    },
    mocks: {
      elasticsearch: {
        source: 'GENERIC_API',
        sourceConfig: [{
          callParameters: [{
            url: 'https://www.example.com/_search',
            headers: {},
            qs: {apikey: 'secretApiKey'},
            body: {
              query: {queryString: 'inputOverride'},
            },
            json: true,
            method: 'POST',
          }],
          error: null,
          response: {statusCode: '200'},
          body: {hits: {hits: ['qux', 'quux']}},
        }], 
      }
    },
    expectedValues: {
      elasticsearch: [{
        hits: {
          hits: ['qux', 'quux'],
        },
      }],
    },
    postCache: {},
  },
  {
    time: 500,
    target: 'elasticsearch',
    preCache: {},
    inputs: {
      esSearchQuery: 'input3'
    },
    preInputs: {
      esSearchQuery: 'input1'
    },
    postInputs: {
      esSearchQuery: 'input3'
    },
    mocks: {
      elasticsearch: {
        source: 'GENERIC_API',
        sourceConfig: [{
          callParameters: [{
            url: 'https://www.example.com/_search',
            headers: {},
            qs: {apikey: 'secretApiKey'},
            body: {
              query: {queryString: 'input3'},
            },
            json: true,
            method: 'POST',
          }],
          error: null,
          response: {statusCode: '200'},
          body: {hits: {hits: ['foo']}},
        }], 
      }
    },
    expectedValues: {
      elasticsearch: [{
        hits: {
          hits: ['foo'],
        },
      }],
    },
    postCache: {},
  },
  ]
};

const awsCachingTargetingTestCase = {
  name: 'Single-source caching request case',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(1000),
    kinesisStreams: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {source: 'kinesisNames'},
        apiConfig: apiConfig(),
      }
    },
  },
  phases: [
  {
    time: 0,
    target: 'kinesisNames',
    preCache: {},
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
  },
  {
    time: 500,
    mocks: {},
    target: ['kinesisNames'],
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    }
  }]
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

const doubleSourceUseTestCase = {
  name: 'Basic Double-AWS-request case',
  dataDependencies: {
    kinesisStreams1: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {
          source: 'kinesisNames',
          formatter: ({kinesisNames}) => kinesisNames,
        },
        apiConfig: apiConfig(),
      }
    },
    kinesisStreams2: {
      accessSchema: kinesisStream,
      params: {
        StreamName: {
          source: 'kinesisNames',
          formatter: ({kinesisNames}) => kinesisNames,
        },
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
          formatter: ({mpls, jpl}) => `${mpls[0].StreamName}-${jpl[0].StreamName}`
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

const dependentAwsTestCaseWithOneValue = {
  name: 'Basic dependent-AWS-request case',
  dataDependencies: {
    kinesisName: {
      accessSchema: kinesisStreamWithAnotherParam,
      params: {
        otherParam: {value: ['foo', 'bar', 'baz']},
        apiConfig: apiConfig(),
      }
    }
  },
  namedMocks: {
    kinesisName: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo', otherParam: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar', otherParam: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz', otherParam: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
  implicitMocks: [
    kinesisNamesMock(),
  ]
};

const dependentAwsTestCaseWithAnOptionalParam = {
  name: 'Test case with an optional param specified in the accessschema and provided',
  dataDependencies: {
    kinesisName: {
      accessSchema: kinesisStreamWithANonRequiredParam,
      params: {
        otherParam: {value: ['foo', 'bar', 'baz']},
        apiConfig: apiConfig(),
      }
    }
  },
  namedMocks: {
    kinesisName: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo', otherParam: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar', otherParam: 'bar'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz', otherParam: 'baz'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
  implicitMocks: [
    kinesisNamesMock(),
  ]
};

const dependentAwsTestCaseWithAnOptionalParamSpecifiedSingly = {
  name: 'Test case with an optional param specified in the accessschema and provided as a single value',
  dataDependencies: {
    kinesisName: {
      accessSchema: kinesisStreamWithANonRequiredParam,
      params: {
        otherParam: {value: 'foo'},
        apiConfig: apiConfig(),
      }
    }
  },
  namedMocks: {
    kinesisName: {
      source: 'AWS',
      sourceConfig: [
        successfulKinesisCall('describeStream', [{StreamName: 'foo', otherParam: 'foo'}], {StreamDescription: {StreamName: 'fooStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'bar', otherParam: 'foo'}], {StreamDescription: {StreamName: 'barStream'}}),
        successfulKinesisCall('describeStream', [{StreamName: 'baz', otherParam: 'foo'}], {StreamDescription: {StreamName: 'bazStream'}}),
      ],
      expectedValue: _.map(['foo', 'bar', 'baz'], (s) => {return {StreamName: `${s}Stream`};})
    }
  },
  implicitMocks: [
    kinesisNamesMock(),
  ]
};

const dependentAwsTestCaseWithAnUnspecifiedOptionalParam = {
  name: 'Test case with an Optional Param specified in the accessschema but not provided',
  dataDependencies: {
    kinesisName: {
      accessSchema: kinesisStreamWithANonRequiredParam,
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
          formatter: ({kinesisNames}) => _.filter(kinesisNames, (n) => n[0] === 'b')
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

const basicTestCases = [
  basicAwsTestCase,
  twoRequestTestCase,
  twoRequestAndOneSyntheticTestCase,
  basicAwsWithGenerator,
  requestAndOneStreamTestCase,
  basicAwsWithFormatter,
  awsWithParamFormatter,
  dependentAwsTestCase,
  dependentAwsTestCaseWithOneValue,
  dependentAwsTestCaseWithAnOptionalParam,
  dependentAwsTestCaseWithAnUnspecifiedOptionalParam,
  dependentAwsTestCaseWithAnOptionalParamSpecifiedSingly,
  doubleSourceTestCase,
  doubleSourceUseTestCase,
  incompleteRequestAwsTestCase,
  requestOnlyTestCase
];

const cachingTestCases = [
  basicAwsCachingTestCase,
  elasticsearchInputTestCase,
  elasticsearchInputNoDefaultTestCase,
  vaultTreeTestCase,
  awsCachingTargetingTestCase,
  awsExpiringCacheTestCase,
  awsCachedDependencyRequirementTestCase,
];

executeBasicTestSuite('Basic report tests', basicTestCases);
executeCachingTestSuite('Caching report tests', cachingTestCases);
