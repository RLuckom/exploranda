const _ = require('lodash');

function requestMock() {
  const requestExpectations = [];

  function mockRequest(params, callback) {
    const parametersReceived = _.cloneDeep(Array.prototype.slice.call(arguments));
    const callbackReceived = parametersReceived[parametersReceived.length - 1];
    const nonCallbackParams = _.cloneDeep(parametersReceived.slice(0, parametersReceived.length - 1));
    const expectation = _.find(requestExpectations, ({args}) => _.isEqual(nonCallbackParams, args));
    if (!expectation) {
      const expected = JSON.stringify(_.map(requestExpectations, 'args'));
      throw new Error(`Unexpected args for request: ${JSON.stringify(nonCallbackParams)}, keys: ${_.map(nonCallbackParams, _.keys)}, expected ${expected}, keys: ${_.map(requestExpectations, ({args}) => _.keys(args))}`);
    }
    expectation.timesCalled = expectation.timesCalled ? expectation.timesCalled + 1 : 1;
    if (!_.isFunction(callbackReceived)) {
      throw new Error(`Last argument for request was not a function: ${callbackReceived}`);
    }
    return setTimeout(() => {
      callbackReceived(
        _.cloneDeep(expectation.error), 
        _.cloneDeep(expectation.response),
        _.cloneDeep(expectation.body)
      );
    });
  }

  function registerExpectation({callParameters, error, response, body}) {
    let expectation = _.find(requestExpectations, ({args}) => _.isEqual(callParameters, args));
    if (!expectation) {
      expectation = _.cloneDeep({
        timesCalled: 0,
        timesExpected: 0,
        args: callParameters,
        error,
        response,
        body
      });
      requestExpectations.push(expectation);
    }
    expectation.timesExpected++;
  }

  function verifyExpectations() {
    _.each(requestExpectations, ({args, timesExpected, timesCalled}) => {
      s = `request with params ${JSON.stringify(args)} -- expected: ${timesExpected} got: ${timesCalled}`;
      console.log(s);
      if (timesExpected !== timesCalled) {
        throw new Error(s);
      }
    });
  }
  
  return {
    getMock: () => mockRequest,
    registerExpectation,
    verifyExpectations
  };
}

module.exports = {requestMock};
