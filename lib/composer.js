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

function validate(dataDependencies) {
  _.each(dataDependencies, ({params}, name) => {
    _.each(params, ({source}, paramName) => {
      validateSourceToDeps(name, source, dataDependencies);
    });
  });
}

function Gopher(dataDependencies) {

  function addToAutoArgs(autoArgs, {accessSchema, formatter, params}, name) {
    if (autoArgs[name]) {
      return autoArgs;
    }
    const paramNamesToRequirements = {};
    const formatters = {};
    let requirements;
    try {
      requirements = _.reduce(params, (collector, {source, formatter}, paramName) => {
        formatters[paramName] = formatter || _.identity;
        if (source) {
          paramNamesToRequirements[paramName] = source;
          if (_.isString(source) || _.isNumber(source)) {
            if (collector.indexOf(source) === -1) {
              collector.push(source);
              // This ensures that when a call to `addToAutoArgs` succeeds,
              // the dependency _and_ all of its transitive dependencies 
              // have been added to the autoArgs. This allows downstream
              // consumers to isolate the effects of unavailable resources
              // to only the specific elements that rely on those resources
              addToAutoArgs(autoArgs, dataDependencies[source], source);
            }
          } else if (_.isArray(source)) {
            _.each(source, (sourceMember) => {
              if (collector.indexOf(sourceMember) === -1) {
                collector.push(sourceMember);
                // See note above.
                addToAutoArgs(autoArgs, dataDependencies[sourceMember], sourceMember);
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
    autoArgs[name] = requirements.length === 1 ? requirements[0] : requirements;
    return autoArgs;
  }

  function report(callback) {
    validate(dataDependencies);
    autoArgs = {};
    _.each(dataDependencies, _.partial(addToAutoArgs, autoArgs));
    return async.auto(autoArgs, callback);
  }

  function targetedReport(target, callback) {
    validate(dataDependencies);
    autoArgs = {};
    if (!_.isArray(target) && (!_.isString(target) && !_.isNumber(target))) {
      throw new Error(`Bad target: ${target} for dataDependencies: ${dataDependencies}`);
    } else if (_.isArray(target)) {
      _.each(target, (t) => addToAutoArgs(autoArgs, dataDependencies[t], t));
    } else {
      addToAutoArgs(autoArgs, dataDependencies[target], target);
    }
    return async.auto(autoArgs, callback);
  }

  return {report, targetedReport};
}

module.exports = {
  Gopher
};
