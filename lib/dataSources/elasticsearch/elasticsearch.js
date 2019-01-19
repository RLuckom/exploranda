const _ = require('lodash');

const search = {
  name: 'elasticsearchSearch',
  dataSource: 'GENERIC_API',
  path: '_search',
  method: 'POST',
  value: {path: 'body'},
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
    apiConfig: {
      description: 'requires `.host`',
    },
    query: {
      description: `see Elasticsearch query DSL docs`
    },
  },
  optionalParams: {
    apiKey: {
      description: 'API key for authentication'
    }
  }
};

const nodeStats = {
  name: 'elasticsearchNodeStats',
  dataSource: 'GENERIC_API',
  path: '_nodes/stats',
  value: {path: 'body'},
  queryParamKeys: [
    'apikey',
  ],
  requiredParams: {
    apiConfig: {
      description: 'requires `.host`',
    },
  },
  optionalParams: {
    apiKey: {
      description: 'API key for authentication'
    }
  }
};

const clusterHealth = {
  name: 'elasticsearchClusterHealth',
  dataSource: 'GENERIC_API',
  path: '_cluster/health',
  value: {path: 'body'},
  queryParamKeys: [
    'level', 'apikey',
  ],
  requiredParams: {
    apiConfig: {
      description: 'requires `.host`',
    },
  },
  optionalParams: {
    apiKey: {
      description: 'API key for authentication'
    }
  }
};

module.exports = {
  nodeStats,
  search,
  clusterHealth,
};
