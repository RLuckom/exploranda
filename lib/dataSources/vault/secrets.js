const _ = require('lodash');

const tree = {
  dataSource:'VAULT',
  requiredParams: {
    path: {},
  },
  params: {
    '?list': true,
  },
  defaultCollector: {},
  value: {path: 'data.keys'},
  incompleteIndicator: (res) => {
    return _.find(_.get(res, 'data.keys'), (k) => _.endsWith(k, '/'));
  },
  nextBatchParamConstructor: (currentRequestParams, res) => {
    return _.chain(res)
    .get('data.keys')
    .filter((k) => _.endsWith(k, '/'))
    .map((k) => _.merge({}, currentRequestParams, {path: currentRequestParams.path + k}))
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

module.exports = {tree};
