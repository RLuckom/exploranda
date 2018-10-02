const _ = require('lodash');
const rewire = require('rewire');
const {kinesisStreams, kinesisStream} = require('../../lib/dataSources/aws/kinesis');
const awsRecordCollector = rewire('../../lib/awsRecordCollector');

const {lookUpRecords} = awsRecordCollector;
const {sufficientParams} = require('../../lib/baseRecordCollector.js');

const arrayAndRecordMixedSchema = {
  name: 'servicesByClusterAndArnArray',
  namespaceDetails: kinesisStreams.namespaceDetails,
  value: {
    path: 'services',
  },
  apiMethod: 'describe',
  requiredParams: {
    cluster: {
      type: 'ClusterArn',
    },
    services: {
      detectArray: (param) => _.isArray(_.get(param, 0)),
      max: 2
    }
  }
};

const recordAndLiteralParamSchema = {
  name: 'servicesByClusterAndArnArray',
  namespaceDetails: kinesisStreams.namespaceDetails,
  value: {
    path: 'services',
  },
  apiMethod: 'describe',
  params: {
    Number: 20,
    Limit: 10
  },
  requiredParams: {
    cluster: {
      type: 'ClusterArn',
    },
  }
};

const recordAndLiteralParamSchemaWithMergeIndividual = {
  name: 'servicesByClusterAndArnArray',
  namespaceDetails: kinesisStreams.namespaceDetails,
  value: {
    path: 'services',
  },
  apiMethod: 'describe',
  params: {
    Number: 20,
    Limit: 10
  },
  requiredParams: {
    cluster: {
      type: 'ClusterArn',
    },
  },
  mergeIndividual: (resultsArray) => {
    return 42;
  }
};

describe('sufficientParams', function() {
  it('returns true when there are no requiredParams', function() {
    expect(sufficientParams(kinesisStreams, {})).toBeTruthy();
  });

  it('returns true when there are requiredParams but they are included in params', function() {
    expect(sufficientParams(kinesisStream, {StreamName: 'foo'})).toBeTruthy();
  });

  it('returns false when there are requiredparams not included in params', function() {
    expect(sufficientParams(kinesisStream, {})).toBeFalsy();
  });

  it('returns true when there are no requiredParams or params', function() {
    expect(sufficientParams(kinesisStreams)).toBeTruthy();
  });

  it('returns false when there are requiredparams and no params', function() {
    expect(sufficientParams(kinesisStream)).toBeFalsy();
  });
});

describe('lookupRecords', function() {
  let oldExecRecordRequest, execCallback, oldKey, oldSecretKey, oldSessionToken;
  let executed = [];

  const AWS = {
    Kinesis: function(config) {
      expect(config).toEqual(_.merge({},
        {
          region: 'us-east-1',
        },
        kinesisStream.namespaceDetails.constructorArgs
      ));
      return {listStreams: fakeExec, describeStream: fakeExec, list: fakeExec, describe: fakeExec};
    }
  }

  function fakeExec() {
    const args = Array.prototype.slice.call(arguments);
    executed.push(args);
    execCallback = args[args.length - 1];
  }

  beforeEach(function() {
    executed = [];
    oldKey = process.env.AWS_ACCESS_KEY_ID;
    oldSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    oldSessionToken = process.env.AWS_SESSION_TOKEN;
    process.env.AWS_ACCESS_KEY_ID = "AWS_ACCESS_KEY_ID";
    process.env.AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY";
    process.env.AWS_SESSION_TOKEN = "AWS_SESSION_TOKEN";
    oldExecRecordRequest = awsRecordCollector.__get__('AWS');
    awsRecordCollector.__set__('AWS', AWS);
  });

  afterEach(function() {
    awsRecordCollector.__set__('AWS', oldExecRecordRequest);
  });

  const kinesisStreamNames = {StreamNames: ['s1', 's2', 's3']};
  describe('base case--no required params', function() {
    it('should just exec the request for the records', function() {
      let callbackCalled = false;
      const params = {p1: 'p2', apiConfig: {region: 'us-east-1'}};
      lookUpRecords(kinesisStreams, params, (err, response) => {
        expect(response).toEqual(kinesisStreamNames.StreamNames);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      execCallback(null, kinesisStreamNames);
      expect(executed[0][0]).toEqual(_.merge({}, kinesisStreams.params, {p1: 'p2'}));
      expect(callbackCalled).toEqual(true);
    });
    it('should allow passed params to override defaults', function() {
      let callbackCalled = false;
      const params = {p1: 'p2', Limit: 200, apiConfig: {region: 'us-east-1'}};
      k2 = _.cloneDeep(kinesisStreams);
      lookUpRecords(kinesisStreams, params, (err, response) => {
        expect(response).toEqual(kinesisStreamNames.StreamNames);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      execCallback(null, kinesisStreamNames);
      expect(executed[0][0]).toEqual(_.merge({}, kinesisStreams.params, {p1: 'p2', Limit: 200}));
      expect(callbackCalled).toEqual(true);
    });
    it('if the results are paginated, it gets all pages', function() {
      let callbackCalled = false;
      const params = {p1: 'p2', Limit: 200, apiConfig: {region: 'us-east-1'}};
      const kinesisStreamNames1 = {StreamNames: ['s1', 's2', 's3'], HasMoreStreams: true};
      const kinesisStreamNames2 = {StreamNames: ['s4', 's5', 's6']};
      lookUpRecords(kinesisStreams, params, (err, response) => {
        expect(response).toEqual(_.concat([], kinesisStreamNames1.StreamNames, kinesisStreamNames2.StreamNames));
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      execCallback(null, kinesisStreamNames1);
      expect(executed[0][0]).toEqual(_.merge({}, kinesisStreams.params, {p1: 'p2', Limit: 200}));
      expect(callbackCalled).toEqual(false);
      execCallback(null, kinesisStreamNames2);
      expect(executed[1][0]).toEqual(_.merge({}, kinesisStreams.params, {ExclusiveStartStreamName: 's3'},{p1: 'p2', Limit: 200}));
      expect(callbackCalled).toEqual(true);
    });
    it('if it needs to split up the params into groups, it does so', function() {
      let callbackCalled = false;
      const params = {cluster: 'clusterArn', services: ['service1', 'service2', 'service3'], apiConfig: {region: 'us-east-1'}};
      const services1 = {services: ['s1', 's2']};
      const services2 = {services: ['s3']};
      lookUpRecords(arrayAndRecordMixedSchema, params, (err, response) => {
        expect(response).toEqual(['s1', 's2', 's3']);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      expect(executed[0][0]).toEqual({cluster: 'clusterArn', services: ['service1', 'service2']});
      expect(callbackCalled).toEqual(false);
      expect(executed[1][0]).toEqual({cluster: 'clusterArn', services: ['service3']});
      executed[0][1](null, services1);
      executed[1][1](null, services2);
      expect(callbackCalled).toEqual(true);
    });
    it('correctly merges provided and default params', function() {
      let callbackCalled = false;
      const params = {apiConfig: {region: 'us-east-1'}, Limit: 40, cluster: 'clusterArn', services: ['service1', 'service2', 'service3']};
      const services = {services: ['s1', 's2', 's3']};
      lookUpRecords(recordAndLiteralParamSchema, params, (err, response) => {
        expect(response).toEqual(['s1', 's2', 's3']);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      expect(executed[0][0]).toEqual({Limit: 40, cluster: 'clusterArn', Number:20, services: ['service1', 'service2', 'service3']});
      expect(callbackCalled).toEqual(false);
      executed[0][1](null, services);
      expect(callbackCalled).toEqual(true);
    });
    it('correctly merges provided and default params', function() {
      let callbackCalled = false;
      const params = {apiConfig: {region: 'us-east-1'}, Limit: 40, cluster: ['clusterArn1', 'clusterArn2'], services: ['service1', 'service2', 'service3']};
      const services = {services: ['s1', 's2', 's3']};
      lookUpRecords(recordAndLiteralParamSchemaWithMergeIndividual, params, (err, response) => {
        expect(response).toEqual(42);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      expect(executed[0][0]).toEqual({Limit: 40, cluster: 'clusterArn1', Number:20, services: ['service1', 'service2', 'service3']});
      expect(executed[1][0]).toEqual({Limit: 40, cluster: 'clusterArn2', Number:20, services: ['service1', 'service2', 'service3']});
      expect(callbackCalled).toEqual(false);
      executed[0][1](null, services);
      executed[1][1](null, services);
      expect(callbackCalled).toEqual(true);
    });
    it('if I pass a param, it uses the param', function() {
      let callbackCalled = false;
      const params = {StreamName: 's1', apiConfig: {region: 'us-east-1'}};
      const s1 = {StreamDescription: {StreamName: 's1'}};
      lookUpRecords(kinesisStream, params, (err, response) => {
        expect(response[0]).toEqual(s1.StreamDescription);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      execCallback(null, s1);
      expect(executed[0][0]).toEqual({StreamName: 's1'});
      expect(callbackCalled).toEqual(true);
    });
    it('if I pass two of a param, it uses them', function() {
      let callbackCalled = false;
      const params = {StreamName: ['s1', 's2'], apiConfig: {region: 'us-east-1'}};
      const s1 = {StreamDescription: {StreamName: 's1'}};
      const s2 = {StreamDescription: {StreamName: 's2'}};
      lookUpRecords(kinesisStream, params, (err, response) => {
        expect(response).toEqual([s1.StreamDescription, s2.StreamDescription]);
        expect(err).toBeFalsy();
        callbackCalled = true;
      });
      expect(executed[0][0]).toEqual({StreamName: 's1'});
      executed[0][executed[1].length - 1](null, s1);
      expect(callbackCalled).toEqual(false);
      expect(executed[1][0]).toEqual({StreamName: 's2'});
      executed[1][executed[1].length - 1](null, s2);
      expect(callbackCalled).toEqual(true);
    });
  });
  describe('recursion case--required params', function() {
    it('should get the dependencies, and then the requested records', function() {
      let callbackCalled = 0;
      const params = {p1: 'p2', apiConfig: {region: 'us-east-1'}};
      const returnStream1 = {StreamDescription: {StreamName: 'stream1'}};
      const returnStream2 = {StreamDescription: {StreamName: 'stream2'}};
      const returnStream3 = {StreamDescription: {StreamName: 'stream3'}};
      lookUpRecords(kinesisStream, params, (err, response) => {
        expect(response).toEqual([
          returnStream1.StreamDescription,
          returnStream2.StreamDescription,
          returnStream3.StreamDescription
        ]);
        expect(err).toBeFalsy();
        callbackCalled++;
      });
      expect(executed[0][0]).toEqual(kinesisStreams.params);
      execCallback(null, kinesisStreamNames);
      expect(executed[1][0]).toEqual(_.merge({}, {StreamName: kinesisStreamNames.StreamNames[0]}, {p1: 'p2'}, kinesisStream.params));
      executed[1][executed[1].length - 1](null, returnStream1);
      executed[2][executed[2].length - 1](null, returnStream2);
      executed[3][executed[3].length - 1](null, returnStream3);
      expect(callbackCalled).toEqual(1);
    });
    it('if there are no dependencies, return no results', function() {
      let callbackCalled = 0;
      const params = {p1: 'p2', apiConfig: {region: 'us-east-1'}};
      const returnStream1 = {StreamDescription: {StreamName: 'stream1'}};
      const returnStream2 = {StreamDescription: {StreamName: 'stream2'}};
      const returnStream3 = {StreamDescription: {StreamName: 'stream3'}};
      lookUpRecords(kinesisStream, params, (err, response) => {
        expect(response).toEqual([]);
        expect(err).toBeFalsy();
        callbackCalled++;
      });
      expect(executed[0][0]).toEqual(kinesisStreams.params);
      execCallback(null, {StreamNames: []});
      expect(executed.length).toEqual(1);
      expect(callbackCalled).toEqual(1);
    });
  });
});
