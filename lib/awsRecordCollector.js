const _ = require('lodash');
const {buildSDKCollector} = require('./baseRecordCollector.js');
var AWS = require('aws-sdk');

function getApi(sourceSchema, paramSet) {
  const constructorArgs = _.merge({},
    _.get(paramSet, 'apiConfig'),
    sourceSchema.namespaceDetails.constructorArgs
  );
  delete paramSet.apiConfig;
  return new AWS[sourceSchema.namespaceDetails.name](constructorArgs)[sourceSchema.apiMethod];
}

module.exports = {
  lookUpRecords: buildSDKCollector(getApi)
};
