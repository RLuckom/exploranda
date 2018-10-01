const _ = require('lodash');
const {buildSDKCollector} = require('./baseRecordCollector.js');
const {google} = require('googleapis');

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
  const auth = google.auth.fromJSON(require(paramSet.apiConfig.keyFilename));
  auth.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const constructorArgs = _.merge({auth},
    _.get(paramSet, 'apiConfig'),
    sourceSchema.namespaceDetails.constructorArgs
  );
  delete paramSet.apiConfig;
  const namespace = google[sourceSchema.namespaceDetails.name](constructorArgs);
  return _.bind(_.get(namespace, sourceSchema.apiMethod), _.get(namespace, sourceSchema.apiMethod.slice(0, sourceSchema.apiMethod.length - 1)));
}

module.exports = {
  lookUpRecords: buildSDKCollector(getApi)
};
