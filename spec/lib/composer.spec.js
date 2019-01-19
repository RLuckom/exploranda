const _ = require('lodash');
const {kinesisStreams, kinesisStream, kinesisStreamMetrics} = require('../../lib/dataSources/aws/kinesis');
const {awsMock} = require('../awsMock');
const {requestMock} = require('../requestMock');
const rewire = require('rewire');
const awsRecordCollector = rewire('../../lib/awsRecordCollector');
const genericApiRecordCollector = rewire('../../lib/genericApiRecordCollector');
const requestRecordCollector = rewire('../../lib/requestRecordCollector');
const composer = rewire('../../lib/composer.js');

const {doRequest} = requestRecordCollector;
const {lookUpRecords} = awsRecordCollector;
const genericApiLookupRecords = genericApiRecordCollector.lookUpRecords;
const {Gopher} = composer;

function executeBasicTestSuite(suiteName, testCases) {
  describe(suiteName, function() {
    let awsMockBuilder, mockBuilders, oldExecRecordRequest, oldRequestRequest, oldVaultRequest;

    beforeEach(function() {
      oldExecRecordRequest = awsRecordCollector.__get__('AWS');
      oldRequestRequest = requestRecordCollector.__get__('request');
      oldVaultRequest = genericApiRecordCollector.__get__('request');
    });

    function buildMocks() {
      awsMockBuilder = awsMock();
      requestMockBuilder = requestMock();
      genericApiMockBuilder = requestMock();
      mockBuilders = {
        AWS: awsMockBuilder,
        REQUEST: requestMockBuilder,
        GENERIC_API: genericApiMockBuilder,
        SYNTHETIC: {registerExpectation: _.noop, verifyExpectations: _.noop},
      };
    }

    function setMocks() {
      awsRecordCollector.__set__('AWS', awsMockBuilder.getMock());
      requestRecordCollector.__set__('request', requestMockBuilder.getMock());
      genericApiRecordCollector.__set__('request', genericApiMockBuilder.getMock());
      oldRecordCollectors = composer.__get__('recordCollectors');
      composer.__set__('recordCollectors', {
        AWS: lookUpRecords,
        REQUEST: doRequest,
        GENERIC_API: genericApiLookupRecords,
        SYNTHETIC: oldRecordCollectors.SYNTHETIC
      });
    }

    afterEach(function() {
      awsRecordCollector.__set__('AWS', oldExecRecordRequest);
      requestRecordCollector.__set__('request', oldRequestRequest);
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
    let awsMockBuilder, mockBuilders, oldExecRecordRequest, oldRequestRequest, oldVaultRequest;

    beforeEach(function() {
      oldExecRecordRequest = awsRecordCollector.__get__('AWS');
      oldRequestRequest = requestRecordCollector.__get__('request');
      oldVaultRequest = genericApiRecordCollector.__get__('request');
    });

    function buildMocks() {
      awsMockBuilder = awsMock();
      requestMockBuilder = requestMock();
      genericApiMockBuilder = requestMock();
      mockBuilders = {
        AWS: awsMockBuilder,
        GENERIC_API: genericApiMockBuilder,
        REQUEST: requestMockBuilder,
      };
    }

    function setMocks() {
      awsRecordCollector.__set__('AWS', awsMockBuilder.getMock());
      requestRecordCollector.__set__('request', requestMockBuilder.getMock());
      genericApiRecordCollector.__set__('request', genericApiMockBuilder.getMock());
      oldRecordCollectors = composer.__get__('recordCollectors');
      composer.__set__('recordCollectors', {
        AWS: lookUpRecords,
        REQUEST: doRequest,
        GENERIC_API: genericApiLookupRecords,
      });
    }

    afterEach(function() {
      awsRecordCollector.__set__('AWS', oldExecRecordRequest);
      requestRecordCollector.__set__('request', oldRequestRequest);
      composer.__set__('recordCollectors', oldRecordCollectors);
    });

    function compareCache(gopherCache, expectedCache) {
      expect(_.keys(gopherCache).length).toEqual(_.keys(expectedCache).length, 'different number of cache keys');
      _.each(expectedCache, (valuesArray, name) => {
        expect(valuesArray.length).toEqual(_.get(gopherCache, `${name}.length`));
        const foundValues = [];
        _.each(valuesArray, (value) => {
          const matchFromCache = _.find(gopherCache[name], (gopherValue) => {
            return _.isEqual(value.r, gopherValue.r) && _.isEqual(value.collectorArgs, gopherValue.collectorArgs) && foundValues.indexOf(gopherValue) === -1;
          });
          if (matchFromCache) {
            foundValues.push(matchFromCache)
          } else {
            console.log(`FAILURE: could not find ${JSON.stringify(value)} in ${JSON.stringify(gopherCache[name])}`);
          }
          expect(matchFromCache).toBeTruthy();
        });
      });
    }

    _.each(testCases, function({name, dataDependencies, inputs, phases}) {
      it(name, function(done) {
        let phasesFinished = 0;
        const gopher = new Gopher(dataDependencies, inputs);
        _.each(phases, ({time, mocks, inputs, expectedValues, target, inputOverrides, preCache, postCache, preInputs, postInputs}) => {
          setTimeout(() => {
            console.log(`starting phase ${phasesFinished + 1}`);
            buildMocks();
            _.each(mocks, (mockSchema, name) => {
              register(mockSchema);
            });
            setMocks();
            if (preCache) {
              compareCache(gopher.getCache(), preCache);
            }
            if (preInputs) {
              expect(preInputs).toEqual(gopher.getInputs());
            }
            _.each(inputs, (value, path) => {
              gopher.setInput(path, value);
            });
            function testAssertionCallback(err, response) {
              expect(response).toEqual(expectedValues);
              _.each(mockBuilders, (mb) => {
                mb.verifyExpectations();
              });
              if (postCache) {
                compareCache(gopher.getCache(), postCache);
              }
              if (postInputs) {
                expect(postInputs).toEqual(gopher.getInputs());
              }
              phasesFinished = phasesFinished + 1;
              console.log(`finished phase ${phasesFinished} out of ${phases.length} at ${Date.now()}`);
              if (phasesFinished === phases.length) {
                done();
              }
            }
            return gopher.report(target, inputOverrides, testAssertionCallback);
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
