const _ = require('lodash');

const tree = {
  name: 'vaultTree',
  dataSource:'GENERIC_API',
  requiredParams: {
    apiConfig: {
      description: 'requires `.host` and `.path`'
    },
    'X-Vault-Token': {
      description: 'vault token'
    },
  },
  params: {
    'list': true,
  },
  queryParamKeys: ['list'],
  headerParamKeys: ['X-Vault-Token'],
  value: {path: 'body.data.keys'},
  incompleteIndicator: (res) => {
    return _.find(_.get(res, 'body.data.keys'), (k) => _.endsWith(k, '/'));
  },
  nextBatchParamConstructor: (currentRequestParams, res) => {
    return _.chain(res)
    .get('body.data.keys')
    .filter((k) => _.endsWith(k, '/'))
    .map((k) => _.merge({}, currentRequestParams, {apiConfig: {path: currentRequestParams.apiConfig.path + k}}))
    .value();
  },
  mergeOperator: (collector, results) => {
    let n = 0;
    const ret = _.reduce(collector, (acc, key) => {
      if (_.endsWith(key, '/')) {
        const val = _.isArray(results[n]) ? _.reduce(results[n], (acc, k) => {
          acc[k] = {__isSecret: true};
          return acc;
        }, {}) : results[n];
        acc[key] = val;
        n++;
      } else {
        acc[key] = {__isSecret: true};
      }
      return acc;
    }, {});
    return ret;
  },
}

const list = {
  name: 'vaultList',
  dataSource:'GENERIC_API',
  requiredParams: {
    apiConfig: {
      description: 'requires `.host` and `.path`'
    },
    'X-Vault-Token': {
      description: 'vault token'
    },
  },
  headerParamKeys: ['X-Vault-Token'],
  params: {
    'list': true,
  },
  queryParamKeys: ['list'],
  value: {path: 'body.data.keys'},
}

const read = {
  name: 'vaultSecret',
  dataSource:'GENERIC_API',
  headerParamKeys: ['X-Vault-Token'],
  requiredParams: {
    apiConfig: {
      description: 'requires `.host` and `.path`'
    },
    'X-Vault-Token': {
      description: 'vault token'
    },
  },
  value: {path: 'body.data'},
  params: {},
}

module.exports = {tree, list, read};
