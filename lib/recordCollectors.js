module.exports = {
  REQUEST: require('./requestRecordCollector').doRequest,
  DOCKER: require('./dockerRecordCollector').lookUpRecords,
  SYNTHETIC: require('./syntheticRecordCollector').transform,
  GOOGLE: require('./gcpRecordCollector').lookUpRecords,
  KUBERNETES: require('./kubernetesRecordCollector').lookUpRecords,
  VAULT: require('./vaultRecordCollector').lookUpRecords,
  AWS: require('./awsRecordCollector').lookUpRecords
};
