module.exports = {
  REQUEST: require('./requestRecordCollector').doRequest,
  GOOGLE: require('./gcpRecordCollector').lookUpRecords,
  AWS: require('./awsRecordCollector').lookUpRecords
};
