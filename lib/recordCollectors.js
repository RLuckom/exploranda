module.exports = {
  REQUEST: require('./requestRecordCollector').doRequest,
  SYNTHETIC: require('./syntheticRecordCollector').transform,
  GOOGLE: require('./gcpRecordCollector').lookUpRecords,
  AWS: require('./awsRecordCollector').lookUpRecords
};
