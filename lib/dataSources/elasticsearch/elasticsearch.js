const _ = require('lodash');

const search = {
  name: 'elasticsearchSearch',
  dataSource: 'GENERIC_API',
  params: {
    path: '_search',
    method: 'POST',
    json: false,
  },
  queryParamKeys: [
    'search_type', 'request_cache', 'apikey', 'scroll', 'preference',
  ],
  bodyParamKeys: [
    'timeout', 'from', 'size', 'terminate_after',
    'batch_reduce_size', 'query', 'sort', '_source',
    'stored_fields', 'script_fields', 'docvalue_fields',
    'post_filter', 'highlight', 'rescore', 'search_type',
    'scroll', 'scroll_id', 'explain', 'version', 'indices_boost',
    'min_score', 'collapse', 'search_after', 'profile', 'aggs',
    'aggregations',
  ],
  requiredParams: {
    host: {},
    query: {},
  }
};

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
  indexStats,
  search,
};
