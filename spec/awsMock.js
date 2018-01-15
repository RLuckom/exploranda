const _ = require('lodash');

function awsMock() {
  const awsExpectations = {};
  const mockAws = {};

  function makeNamespace(name) {
    return function namespace() {
      const parametersReceived = _.cloneDeep(Array.prototype.slice.call(arguments));
      const methodHolder = _.find(awsExpectations[name], ({args, methodHolder}) => _.isEqual(parametersReceived, args));
      if (!methodHolder) {
        throw new Error(`Unexpected initialization args for aws namespace ${name}: ${JSON.stringify(parametersReceived)}`);
      }
      methodHolder.timesCalled = methodHolder.timesCalled ? methodHolder.timesCalled + 1 : 1;
      return methodHolder.methodHolder.methods;
    }
  }

  function makeMethod(namespace, namespaceParams, name) {
    return function method() {
      const parametersReceived = _.cloneDeep(Array.prototype.slice.call(arguments));
      const callbackReceived = parametersReceived[parametersReceived.length - 1];
      const nonCallbackParams = _.cloneDeep(parametersReceived.slice(0, parametersReceived.length - 1));
      const methodHolder = _.find(awsExpectations[namespace], ({args, methodHolder}) => _.isEqual(namespaceParams, args)).methodHolder;
      const specificMethodHolder = _.find(methodHolder.resultsByMethodAndParams[name], ({methodParams}) => _.isEqual(methodParams, nonCallbackParams));
      if (!specificMethodHolder) {
        throw new Error(`Unexpected args for aws method ${name}: ${JSON.stringify(nonCallbackParams)}`);
      }
      specificMethodHolder.timesCalled = specificMethodHolder.timesCalled ? specificMethodHolder.timesCalled + 1 : 1;
      if (!_.isFunction(callbackReceived)) {
        throw new Error(`Last argument for ${name} was not a function: ${callbackReceived}`);
      }
      return setTimeout(() => callbackReceived(_.cloneDeep(specificMethodHolder.error), _.cloneDeep(specificMethodHolder.response)));
    };
  }

  function getMethodHolderByNamespaceParams(namespace, params, noInit) {
    awsExpectations[namespace] = awsExpectations[namespace] || [];
    let methodHolder = _.find(awsExpectations[namespace], ({args, methodHolder}) => _.isEqual(params, args));
    if (!methodHolder) {
      methodHolder = {
        timesExpected: 0,
        timesCalled: 0,
        args: _.cloneDeep(params),
        methodHolder: {methods: {}, resultsByMethodAndParams: {}}
      }; 
      awsExpectations[namespace].push(methodHolder);
    }
    if (!noInit) {
      methodHolder.timesExpected++;
    }
    return methodHolder.methodHolder;
  }

  function registerExpectation({initialization, callParameters, error, response, noInit}) {
    const namespace = initialization.namespace;
    const namespaceParams = initialization.arguments;
    const method = callParameters.method;
    const methodParamsToAdd = callParameters.arguments;
    mockAws[namespace] = mockAws[namespace] || makeNamespace(namespace);
    const methodHolder = getMethodHolderByNamespaceParams(namespace, _.cloneDeep(namespaceParams), noInit);
    methodHolder.methods[method] =  methodHolder.methods[method] || makeMethod(namespace, _.cloneDeep(namespaceParams), method);
    let specificMethodHolder = _.find(methodHolder.resultsByMethodAndParams[method], ({methodParams}) => _.isEqual(methodParams, methodParamsToAdd));
    if (!specificMethodHolder) {
      specificMethodHolder = {
        timesExpected: 0,
        timesCalled: 0,
        methodParams: _.cloneDeep(methodParamsToAdd),
        error,
        response
      };
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

module.exports = {awsMock};
