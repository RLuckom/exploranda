const _ = require('lodash');

const nodeStats = {
  dataSource: 'REQUEST',
  generateRequest: ({esHost}) => {
    return {
      url: `${esHost}/_nodes/stats`,
      method: 'GET',
      json: true
    };
  },
  requiredParams: {
    esHost:{}
  },
  ignoreErrors: true
};

const indexStats = {
  dataSource: 'REQUEST',
  generateRequest: ({esHost}) => {
    return {
      url: `${esHost}/_cluster/health?level=indices`,
      method: 'GET',
      json: true
    };
  },
  requiredParams: {
    esHost:{}
  },
  ignoreErrors: true
};

module.exports = {
  nodeStats,
  indexStats
};
