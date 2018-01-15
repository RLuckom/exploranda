flag to make sure we finished & checked results
write dependencies schema to test
run dependencies schema
for each schema step:
  verify that the correct params were delivered
    - the initialization params
    - the request / call params
  deliver the results to the callback
verify (in a callback) that the correct results were delivered
synchronously check that the results flag is true, indicating that the results have been checked


psuedocode for this pattern:

dependenciesSchema = {
  stage1Dep1: {...},
  stage1Dep2: {...},
  stage2Dep1: {...},
  stage2Dep2: {...}
};

const awsExpectations = {};

let mockAws;

beforeEach(function() {
  mockAws = {}; // erase all
  // rewire bullshit to set the dataSourceObject members on the report
});

afterEach(function() {
  // rewire bullshit to unset the dataSourceObject members on the report
});


function awsMock() {
  const awsExpectations = {};
  const mockAws = {};

function makeNamespace(name) {
  return function namespace() {
    const parametersReceived = _.cloneDeep(Array.prototype.slice.call(arguments));
    const methodHolder = _.get(_.find(awsExpectations[name], ({args, methodHolder}) => _.isEqual(parametersReceived, args)), 'methodHolder');
    if (!methods) {
      throw new Error(`Unexpected initialization args for aws namespace ${name}: ${JSON.stringify(parametersReceived)}`);
    }
    methodHolder.timesCalled = methodHolder.timesCalled ? methodHolder.timesCalled + 1 : 1;
    return methodHolder.methods;
  }
}

function makeMethod(namespace, namespaceParams, name) {
  return function method() {
    const parametersReceived = _.cloneDeep(Array.prototype.slice.call(arguments));
    const callbackReceived = parametersReceived[parametersReceived.length[-1]];
    const nonCallbackParams = _.cloneDeep(parametersReceived.slice(0, parametersReceived.length - 1));
    const methodHolder = _.find(awsExpectations[namespace], ({args, methodHolder}) => _.isEqual(namespaceParams, args)).methodHolder;
    const specificMethodHolder = _.find(methodHolder.resultsByMethodAndParams[name], ({methodParams}) => _.isEqual(methodParams, nonCallbackParams));
    if (!specificMethodHolder) {
      throw new Error(`Unexpected args for aws method ${name}: ${JSON.stringify(nonCallbackParams)}`);
    }
    specificMethodHolder.timesCalled = specificMethodHolder.timesCalled ? specificMethodHolder.timesCalled + 1 : 1;
    if (!_.isFunction(callbackReceived)) {
      throw new Error(`Last argument for ${name} was not a function`);
    }
    return callbackReceived(_.cloneDeep(specificMethodHolder.error), _.cloneDeep(specificMethodHolder.response));
  };
}

function getMethodHolderByNamespaceParams(name, params) {
  awsExpectations[namespace] = awsExpectations[namespace] || [];
  let methodHolder = _.find(awsExpectations[namespace], ({args, methodHolder}) => _.isEqual(params, args));
  if (!methodHolder) {
    methodHolder = {timesExpected: 0, args: _.cloneDeep(params), methodHolder: {methods: {}, resultsByMethodAndParams: {}}}; 
    awsExpectations[namespace].push(methodHolder);
  }
  methodHolder.timesExpected++;
  return methodHolder.methodHolder;
}

function registerExpectation({initialization, callParameters, error, response) {
  const namespace = initialization.namespace;
  const namespaceParams = initialization.arguments;
  const method = callParameters.method;
  const methodParamsToAdd = callParameters.arguments;
  mockAws.AWS[name] = mockAws.AWS[name] || makeNamespace(name);
  const methodHolder = getMethodHolderByNamespaceParams(namespace, _.cloneDeep(namespaceParams));
  methodHolder.methods[method] =  methodHolder.methods[method] || makeMethod(namespace, _.cloneDeep(namespaceParams), method);
  let specificMethodHolder = _.find(methodHolder.resultsByMethodAndParams[name], ({methodParams}) => _.isEqual(methodParams, methodParamsToAdd));
  if (!specificMethodHolder) {
    specificMethodHolder = {timesExpected: 0, methodParams: _.cloneDeep(methodParamsToAdd), error, response};
    methodHolder.resultsByMethodAndParams[method] = methodHolder.resultsByMethodAndParams[method] || [];
    methodHolder.resultsByMethodAndParams[method].push(specificMethodHolder);
  }
  specificMethodHolder.timesExpected++;
}

function verifyExpectations() {
  _.each(awsExpectations, (paramArgsArray, name) => {
    _.each(paramArgsArray, ({args, timesExpected, timesCalled, methodHolder}) => {
      const s = `namespace ${name} with params ${JSON.stringify(args)} -- expected ${timesExpected}, got ${timesCalled}`;
      console.log(s);
      if (timesExpected !== timesCalled) {
        throw new Error(s);
      }
      _.each(methodHolder.resultsByMethodAndParams, (paramsAndResultsArray, methodName) => {
        _.each(paramsAndResultsArray, ({methodParams, timesExpected, timesCalled}) => {
          const s = `${name}.${methodName} with initial args ${JSON.stringify(args)} and method args ${JSON.stringify(methodParams)} -- expected ${timesExpected}, got ${timesCalled}`;
          console.log(s);
          if (timesExpected !== timesCalled) {
            throw new Error(s);
          }
        });
      });
    });
  });
}

return {
  getMock: () => _.cloneDeep(mockAws),
  registerExpectation,
  verifyExpectations
};
}


expectedStageValues = {
  stage1Dep1: {
    source: awsSource,
    sourceConfig: {
      initialization: {
        namespace: 'Kinesis',
        arguments: [{region: 'us-east-1'}]
      },
      callParameters: {
        method: 'listStreams',
        arguments: [{...}]
      },
      error: {},
      response: {...}
    },
    expectedValue: {...}
  },
  stage1Dep2: {...},
  stage2Dep1: {...},
  stage2Dep2: {...},
}

let resultsCheckedFlag = false;

