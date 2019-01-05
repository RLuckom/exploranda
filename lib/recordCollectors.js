module.exports = {
  REQUEST: require('./requestRecordCollector').doRequest,
  GENERIC_API: require('./genericApiRecordCollector').lookUpRecords,
  SYNTHETIC: require('./syntheticRecordCollector').transform,
  GOOGLE: require('./gcpRecordCollector').lookUpRecords,
  KUBERNETES: require('./kubernetesRecordCollector').lookUpRecords,
  AWS: require('./awsRecordCollector').lookUpRecords
};
