const _ = require('lodash');

const search = {
  name: 'elasticsearchSearch',
  dataSource: 'GENERIC_API',
  params: {
    path: '_search',
    method: 'POST',
  },
  queryParamKeys: [
    'search_type', 'request_cache', 'apikey', 'scroll', 'preference', 'level',
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
  name: 'elasticsearchNodeStats',
  dataSource: 'GENERIC_API',
  params: {
    path: '_nodes/stats',
  },
  queryParamKeys: [
    'apikey',
  ],
  requiredParams: {
    host: {},
  }
};

const clusterHealth = {
  name: 'elasticsearchClusterHealth',
  dataSource: 'GENERIC_API',
  params: {
    path: '_cluster/health',
  },
  queryParamKeys: [
    'level', 'apikey',
  ],
  requiredParams: {
    host: {},
  }
};

module.exports = {
  nodeStats,
  search,
  clusterHealth,
};
