const _ = require('lodash');
const async = require('async');
const recordCollectors = require('./recordCollectors');

function validateSourceToDeps(dependencyName, source, dataDependencies) {
  if (source) {
    if (_.isString(source) || _.isNumber(source)) {
      if (!dataDependencies[source]) {
        throw new Error(`${dependencyName} has an invalid parameter source: ${source} not in ${JSON.stringify(dataDependencies)}`);
      }
    } else if (_.isArray(source)) {
      _.each(source, (sourceMember) => {
        if (!dataDependencies[sourceMember]) {
          throw new Error(`${dependencyName} has an invalid parameter source: ${sourceMember} not in ${JSON.stringify(dataDependencies)}`);
        }
      });
    } else {
      throw new Error(`source ${source} has invalid type ${typeof source}`)
    }
  }
}

function report(dataDependencies, callback) {
  autoArgs = _.reduce(dataDependencies, (collector, {accessSchema, formatter, shape, params}, name) => {
    const paramNamesToRequirements = {};
    const formatters = {};
    let requirements;
    try {
      requirements = _.reduce(params, (collector, {source, formatter}, paramName) => {
        formatters[paramName] = formatter || _.identity;
        validateSourceToDeps(name, source, dataDependencies);
        if (source) {
          paramNamesToRequirements[paramName] = source;
          if (_.isString(source) || _.isNumber(source)) {
            if (collector.indexOf(source) === -1) {
              collector.push(source);
            }
          } else if (_.isArray(source)) {
            _.each(source, (sourceMember) => {
              if (collector.indexOf(sourceMember) === -1) {
                collector.push(sourceMember);
              }
            });
          }
        }
        return collector;
      }, []);
    } catch(err) {
      throw new Error(`Problem getting results for ${name} with accessSchema ${accessSchema.name} and params: ${JSON.stringify(params, null, 2)}. error: ${err}`);
    }
    const literals = _.reduce(params, (collector, {value}, paramName) => {
      if (value) {
        collector[paramName] = value;
      }
      return collector;
    }, {});
    const generated = _.reduce(params, (collector, {generate}, paramName) => {
      if (generate) {
        collector[paramName] = generate();
      }
      return collector;
    }, {});

    function returnValueBookkeeping(callback) {
      return function(e, r) {
        const formattedResults = formatter ? formatter(r) : r;
        return callback(e, formattedResults);
      };
    }
    function getRecords() {
      const args = Array.prototype.slice.call(arguments);
      if (args.length === 1) {
        return recordCollectors[accessSchema.dataSource](accessSchema, _.merge({}, literals, generated), returnValueBookkeeping(args[0]));
      }
      const dependencies = _.reduce(paramNamesToRequirements, (collector, source, paramName) => {
        paramDeps = _.cloneDeep(_.at(args[0], source));
        collector[paramName] = formatters[paramName].apply(this, paramDeps);
        return collector;
      }, {});
      return recordCollectors[accessSchema.dataSource](accessSchema, _.merge({}, literals, generated, dependencies), returnValueBookkeeping(args[1]));
    }
    requirements.push(getRecords);
    collector[name] = requirements.length === 1 ? requirements[0] : requirements;
    return collector;
  }, {});
  return async.auto(autoArgs, callback);
}

module.exports = {
  report
};
