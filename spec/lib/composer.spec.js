const _ = require('lodash');
const {kinesisStreams, kinesisStream, kinesisStreamMetrics} = require('../../lib/dataSources/aws/kinesis');
const {awsMock} = require('../awsMock');
const {requestMock} = require('../requestMock');
const rewire = require('rewire');
const awsRecordCollector = rewire('../../lib/awsRecordCollector.js');
const requestRecordCollector = rewire('../../lib/requestRecordCollector');
const composer = rewire('../../lib/composer.js');

const {doRequest} = requestRecordCollector;
const {lookUpRecords} = awsRecordCollector;
const {Gopher} = composer;

function executeTestSuite(suiteName, testCases) {
  describe(suiteName, function() {
    let awsMockBuilder, mockBuilders, oldExecRecordRequest, oldRequest;

    beforeEach(function() {
      oldExecRecordRequest = awsRecordCollector.__get__('AWS');
      oldRequest = requestRecordCollector.__get__('request');
    });

    function buildMocks() {
      awsMockBuilder = awsMock();
      requestMockBuilder = requestMock();
      mockBuilders = {
        AWS: awsMockBuilder,
        REQUEST: requestMockBuilder,
      };
    }

    function setMocks() {
      awsRecordCollector.__set__('AWS', awsMockBuilder.getMock());
      requestRecordCollector.__set__('request', requestMockBuilder.getMock());
      oldRecordCollectors = composer.__get__('recordCollectors');
      composer.__set__('recordCollectors', {AWS: lookUpRecords, REQUEST: doRequest});
    }

    afterEach(function() {
      awsRecordCollector.__set__('AWS', oldExecRecordRequest);
      requestRecordCollector.__set__('request', oldRequest);
      composer.__set__('recordCollectors', oldRecordCollectors);
    });

    _.each(testCases, function({name, dataDependencies, namedMocks, implicitMocks}) {
      it(name, function(done) {
        buildMocks();
        const expectedResult = {};
        function register({source, sourceConfig}) {
          if (_.isArray(sourceConfig)) {
            _.each(sourceConfig, mockBuilders[source].registerExpectation);
          } else {
            mockBuilders[source].registerExpectation(sourceConfig);
          }
        }
        _.each(namedMocks, (mockSchema, dependencyName) => {
          register(mockSchema);
          expectedResult[dependencyName] = _.cloneDeep(mockSchema.expectedValue);
        });
        _.each(implicitMocks, (mockSchema) => {
          register(mockSchema);
        });
        setMocks();
        new Gopher(dataDependencies).report((err, response) => {
          expect(response).toEqual(expectedResult);
          _.each(mockBuilders, (mb) => {
            mb.verifyExpectations();
          });
          done();
        });
      });
    });
  });
}

const keys = {
  accessKeyId: "AWS_ACCESS_KEY_ID",
  secretAccessKey: "AWS_SECRET_ACCESS_KEY",
  sessionToken: "AWS_SESSION_TOKEN"
};

module.exports = {executeTestSuite, keys};
