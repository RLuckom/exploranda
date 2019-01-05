const _ = require('lodash');
const {buildSDKCollector} = require('./baseRecordCollector.js');
const request = require('request');

function addUserAuthIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'user') && _.get(apiConfig, 'pass')) {
    requestParams.auth = {user: apiConfig.user, pass: apiConfig.pass};
  }
  return requestParams;
}

function addBearerAuthIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'token') && _.get(apiConfig, 'pass')) {
    requestParams.auth = {bearer: apiConfig.token};
  }
  return requestParams;
}

function addCAIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'ca')) {
    requestParams.ca = apiConfig.ca;
  }
  return requestParams;
}

function addClientCertIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'cert')) {
    requestParams.cert = apiConfig.cert;
  }
  if (_.get(apiConfig, 'key')) {
    requestParams.key = apiConfig.key;
  }
  if (_.get(apiConfig, 'passphrase')) {
    requestParams.passphrase = apiConfig.passphrase;
  }
  return requestParams;
}

function urlBuilder(path) {
  return _.template('https://${host}' + (_.startsWith(path, '/') ? path : '/' + (path || '')));
}

function pathParams(sourceSchema, params) {
  return _.pickBy(_.merge({}, sourceSchema.params, params), (v, n) => !_.startsWith(n, '?'));
}

function queryParams(sourceSchema, params) {
  return _.reduce(_.pickBy(_.merge({}, sourceSchema.params, params), (v, n) => _.startsWith(n, '?')), (acc, v, n) => {
    acc[n.slice(1)] = v;
    return acc;
  }, {});
}

function genericRequestApi(sourceSchema) {
  return function(params, callback) {
    const host = _.get(params, 'host') || _.get(sourceSchema, 'params.host');
    if (!host) {
      throw new Error(`Host not found in API params ${params} for call to ${sourceSchema.name}`);
    }
    // Assume json but allow it to be set false
    const requestParams = {
      json: _.isUndefined(sourceSchema.json) ? true : sourceSchema.json,
      method: _.get(params, 'method') || _.get(sourceSchema, 'params.method') || 'GET'
    };
    const apiConfig = _.get(params, 'apiConfig');
    addCAIfProvided(apiConfig, requestParams);
    addClientCertIfProvided(apiConfig, requestParams);
    // the order here determines precedence--bearer overrides user:pass
    addUserAuthIfProvided(apiConfig, requestParams);
    addBearerAuthIfProvided(apiConfig, requestParams);
    const urlBuilderFunction = sourceSchema.urlBuilder || urlBuilder(_.get(params, 'path'));
    const requestQueryBuilderFunction = sourceSchema.requestQueryBuilder || _.identity;
    const requestBodyBuilderFunction = sourceSchema.requestBodyBuilder || _.identity;
    const requestHeadersBuilderFunction = sourceSchema.requestHeadersBuilder || _.identity;
    const pathParams = _.merge({host}, _.pick(params, sourceSchema.pathParamKeys));
    const queryParams = _.pick(params, sourceSchema.queryParamKeys);
    const bodyParams = sourceSchema.bodyParamKeys ? _.pick(params, sourceSchema.bodyParamKeys) : null;
    const headerParams = _.pick(params, sourceSchema.headerParamKeys);
    return request(
      _.merge({
        url: urlBuilderFunction(pathParams),
        qs: requestQueryBuilderFunction(queryParams),
        headers: requestHeadersBuilderFunction(headerParams),
        body: requestBodyBuilderFunction(bodyParams),
      }, _.cloneDeep(requestParams)),
      (e, r, b) => {
        callback(e, {body: b, statusCode: r.statusCode, headers: r.headers});
      }
    );
  }
}

function getApi(sourceSchema, paramSet) {
  return function(params, callback) {
  };
}

module.exports = {
  lookUpRecords: buildSDKCollector(genericRequestApi)
};
