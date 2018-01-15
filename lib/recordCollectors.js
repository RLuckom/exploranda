module.exports = {
  REQUEST: require('./requestRecordCollector').doRequest,
  AWS: require('./awsRecordCollector').lookUpRecords
};
