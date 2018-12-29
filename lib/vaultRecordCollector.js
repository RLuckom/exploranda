const _ = require('lodash');
const {buildSDKCollector} = require('./baseRecordCollector.js');
var request = require('request');

/* The getAPI function is given a sourceSchema and paramSet and has
 * to return a function that takes a paramSet and callback and
 * calls the callback with the (err, response) of calling the API.
 *
 * The sourceSchema usually includes something like
 *  {
 *    namespaceDetails: {
 *      name: String
 *      constructorArgs: {...} Optional
 *    },
 *    apiMethod: String
 *  }
 * where the namespaceDetails include the instructions for instantiating
 * an API object and the apiMethod specifies a specific method to call.
 * This structure should be customized to align conveniently with
 * the shape of the provided SDK, without compromising the return
 * value of getApi.
 *
 * The paramSet is generally required because APIs such as AWS and
 * GCP tend to require credential or region information at the time you
 * instantiate the API rather than the time at which you call a
 * method on it. To preserve flexibility (for instance, "I want to list
 * my instances in us-east-1 _and_ us-west-2"), exploranda allows
 * clients to specify region and credential information on a per-resource
 * (i.e. per-API-call) basis. This neccessitates using the credential
 * and / or region information intended for the individual method call
 * to instantiate the API object on which the method lives.
 */
function getApi(sourceSchema, paramSet) {
  return function(params, callback) {
    const host = params.host;
    if (!host) {
      throw new Error(`Host not found in params ${params} for call to ${sourceSchema.name}`);
    }
    const token = params.token;
    if (!token) {
      throw new Error(`Token not found in params ${params} for call to ${sourceSchema.name}`);
    }
    const requestParams = {
      headers: {
        'X-Vault-Token': token
      },
      json: true
    };
    if (params.cert) {
      requestParams.cert = params.cert;
    }
    if (params.key) {
      requestParams.key = params.key;
    }
    if (params.passphrase) {
      requestParams.passphrase = params.passphrase;
    }
    if (params.ca) {
      requestParams.ca = params.ca;
    }
    if (!params.path) {
      throw new Error(`Path not found in params ${params} for call to ${sourceSchema.name}`);
    }
    const currentRequestParams = _.merge({url: `https://${host}/${params.path}`}, requestParams);
      const queryParams = _.reduce(_.pickBy(_.merge({}, sourceSchema.params, params), (v, n) => _.startsWith(n, '?')), (acc, v, n) => {
      acc[n.slice(1)] = v;
      return acc;
    }, {});
    return request(_.merge(
      {
        qs: queryParams,
      }, currentRequestParams
    ), (e, r, b) => callback(e, b));
  };
}

module.exports = {
  lookUpRecords: buildSDKCollector(getApi)
};
