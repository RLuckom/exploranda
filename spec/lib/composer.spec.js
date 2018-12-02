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

function executeBasicTestSuite(suiteName, testCases) {
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

function executeCachingTestSuite(suiteName, testCases) {
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

    _.each(testCases, function({name, dataDependencies, phases}) {
      fit(name, function(done) {
        let phasesFinished = 0;
        const gopher = new Gopher(dataDependencies);
        _.each(phases, ({time, mocks, expectedValues}) => {
          setTimeout(() => {
            console.log(`starting phase ${phasesFinished + 1}`);
            buildMocks();
            _.each(mocks, (mockSchema, name) => {
              register(mockSchema);
            })
            setMocks();
            gopher.report((err, response) => {
              expect(response).toEqual(expectedValues);
              _.each(mockBuilders, (mb) => {
                mb.verifyExpectations();
              });
              phasesFinished = phasesFinished + 1;
              console.log(`finished phase ${phasesFinished} out of ${phases.length} at ${Date.now()}`);
              if (phasesFinished === phases.length) {
                done();
              }
            });
          }, time);
        });
        function register({source, sourceConfig}) {
          if (_.isArray(sourceConfig)) {
            _.each(sourceConfig, mockBuilders[source].registerExpectation);
          } else {
            mockBuilders[source].registerExpectation(sourceConfig);
          }
        }
      });
    });
  });
}

const keys = {
  accessKeyId: "AWS_ACCESS_KEY_ID",
  secretAccessKey: "AWS_SECRET_ACCESS_KEY",
  sessionToken: "AWS_SESSION_TOKEN"
};

module.exports = {executeBasicTestSuite, executeCachingTestSuite, keys};
