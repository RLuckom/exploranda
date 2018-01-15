const _ = require('lodash');
var request = require('request');

function doRequest(sourceSchema, params, callback) {
  const requestParams = sourceSchema.generateRequest(params);
  let responseCollector;
  let currentParams = _.cloneDeep(requestParams);
  function completeRequest(err, response, body) {
    const stat = _.toNumber(response.statusCode);
    if (err || (stat < 200 || stat >= 300)) {
      if (sourceSchema.ignoreErrors) {
        return callback(null, _.cloneDeep(sourceSchema.defaultResponse));
      } else {
        return callback(err || {statusCode: stat});
      }
    }
    if (!responseCollector) {
      responseCollector = _.cloneDeep(body);
    } else {
      responseCollector = (sourceSchema.mergeResponses || _.concat)(responseCollector, _.cloneDeep(body));
    }
    if ((sourceSchema.incomplete || _.noop)(response, _.cloneDeep(body))) {
      const paramsToUse = sourceSchema.nextRequest(currentParams, body);
      currentParams = _.cloneDeep(paramsToUse);
      return request(currentParams, completeRequest);
    } else {
      responseCollector = (sourceSchema.formatter || _.identity)(responseCollector);
      return callback(null, responseCollector);
    }
  }
  return request(requestParams, completeRequest);
}

module.exports = {
  doRequest
};
