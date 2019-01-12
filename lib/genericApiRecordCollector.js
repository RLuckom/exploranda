const _ = require('lodash');
const {buildSDKCollector} = require('./baseRecordCollector.js');
const request = require('request');
const parseLinkHeader = require('parse-link-header');
const url = require('url');

function addUserAuthIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'user') && _.get(apiConfig, 'pass')) {
    requestParams.auth = {user: apiConfig.user, pass: apiConfig.pass};
  }
  return requestParams;
}

function addBearerAuthIfProvided(apiConfig, requestParams) {
  if (_.get(apiConfig, 'token')) {
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
  return _.template('${__exp_protocol}${__exp_host}' + (_.startsWith(path, '/') ? path : '/' + (path || '')));
}

function annotateHeaders(headers) {
  if (_.get(headers, 'link')) {
    headers.link = parseLinkHeader(headers.link);
    _.each(headers.link, (values, name) => {
      const parsed = url.parse(values.url);
      parsed.protocol = parsed.protocol + (parsed.slashes ? '//' : '');
      headers.link[name].url = parsed;
    });
  }
  return headers;
}

function getPathParams(apiConfig, sourceSchema, params) {
  const host = _.get(apiConfig, 'host') || sourceSchema.host;
  const protocol = _.get(apiConfig, 'protocol') || sourceSchema.protocol || 'https://';
  const internalParams = {
    __exp_protocol: protocol,
    __exp_host: host,
  };
  const pathParamKeys = _.concat(sourceSchema.pathParamKeys, _.get(params, 'apiConfig.pathParamKeys'));
  return _.merge(internalParams, _.pick(params, pathParamKeys));
}

function genericRequestApi(sourceSchema) {
  return function(params, callback) {
    const host = _.get(params, 'apiConfig.host') || _.get(sourceSchema, 'host');
    if (!host) {
      throw new Error(`Host not found in API params ${params} for call to ${sourceSchema.name}`);
    }
    const apiConfig = _.get(params, 'apiConfig');
    // Assume json but allow it to be set false explicitly
    const requestParams = {
      json: _.isUndefined(sourceSchema.json) ? true : sourceSchema.json,
      method: _.get(apiConfig, 'method') || _.get(sourceSchema, 'method') || 'GET'
    };
    addCAIfProvided(apiConfig, requestParams);
    addClientCertIfProvided(apiConfig, requestParams);
    // the order here determines precedence--bearer overrides user:pass
    addUserAuthIfProvided(apiConfig, requestParams);
    addBearerAuthIfProvided(apiConfig, requestParams);
    const urlBuilderFunction = sourceSchema.urlBuilder || urlBuilder(_.get(params, 'apiConfig.path') || sourceSchema.path);
    const requestQueryBuilderFunction = sourceSchema.requestQueryBuilder || _.identity;
    const requestBodyBuilderFunction = sourceSchema.requestBodyBuilder || _.identity;
    const requestHeadersBuilderFunction = sourceSchema.requestHeadersBuilder || _.identity;
    const pathParams = getPathParams(apiConfig, sourceSchema, params);
    const queryParams = _.pick(params, _.concat(sourceSchema.queryParamKeys, _.get(params, 'apiConfig.queryParamKeys')));
    const bodyParams = (sourceSchema.bodyParamKeys || _.get(params, 'apiConfig.bodyParamKeys')) ? _.pick(params, _.concat(sourceSchema.bodyParamKeys, _.get(params, 'apiConfig.bodyParamKeys'))) : void(0);
    const headerParams = _.pick(params, _.concat(sourceSchema.headerParamKeys, _.get(params, 'apiConfig.headerParamKeys')));
    return request(
      _.merge({
        url: urlBuilderFunction(pathParams),
        qs: requestQueryBuilderFunction(queryParams),
        headers: requestHeadersBuilderFunction(headerParams),
        body: requestBodyBuilderFunction(bodyParams),
      }, _.cloneDeep(requestParams)),
      (e, r, b) => {
        callback(e, {
          body: b,
          statusCode: r.statusCode,
          headers: annotateHeaders(r.headers)
        });
      }
    );
  }
}

module.exports = {
  lookUpRecords: buildSDKCollector(genericRequestApi)
};
