const _ = require('lodash');
const async = require('async');
const recordCollectors = require('./recordCollectors');

//simple function to display the error or retrieved dependencies
function display(error, dependencies) {
  if (error) {
    console.log(`error: ${error}`);
  } else {
    console.log(JSON.stringify(dependencies, null, 2));
  }
}

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

function validateInputExists(inputName, input, inputs) {
  if (input) {
    if (_.isString(input) || _.isNumber(input)) {
      return;
    } else if (_.isArray(input)) {
      _.each(input, (inputMember) => {
        if (_.isUndefined(_.get(inputs, inputMember))) {
          throw new Error(`${inputName} has an invalid input: ${inputMember} not in ${JSON.stringify(inputs)}`);
        }
      });
    } else {
      throw new Error(`input ${input} has invalid type ${typeof input}`)
    }
  }
}

function validate(dataDependencies, inputs) {
  _.each(dataDependencies, ({params}, name) => {
    _.each(params, ({source, input}, paramName) => {
      validateSourceToDeps(name, source, dataDependencies);
      validateInputExists(name, input, inputs);
    });
  });
}

function Gopher(dataDependencies, inputs) {

  const cache = {};

  inputs = _.cloneDeep(inputs) || {};

  function setInput(path, val) {
    _.set(inputs, path, val);
  }

  function getInput(path) {
    return _.cloneDeep(_.get(inputs, path));
  }

  function getInputs() {
    return _.cloneDeep(inputs);
  }

  function addToAutoArgs(autoArgs, inputOverrides, {accessSchema, formatter, params, cacheLifetime}, name) {
    if (autoArgs[name]) {
      return autoArgs;
    }
    const paramNamesToRequirements = {};
    const formatters = {};
    let requirements;
    try {
      requirements = _.reduce(params, (collector, {source, input, formatter}, paramName) => {
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
              addToAutoArgs(autoArgs, inputOverrides, dataDependencies[source], source);
            }
          } else if (_.isArray(source)) {
            _.each(source, (sourceMember) => {
              if (collector.indexOf(sourceMember) === -1) {
                collector.push(sourceMember);
                // See note above.
                addToAutoArgs(autoArgs, inputOverrides, dataDependencies[sourceMember], sourceMember);
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
      if (!_.isUndefined(value)) {
        collector[paramName] = value;
      }
      return collector;
    }, {});
    const inputs = _.reduce(params, (collector, {input, formatter}, paramName) => {
      if (!_.isUndefined(input)) {
        if (_.isString(input) || _.isNumber(input)) {
          const override = _.get(inputOverrides, input);
          const priorityInpyt =  _.isUndefined(override) ? getInput(input) : override;
          collector[paramName] = (formatter || _.identity)({[input]: priorityInpyt});
        } else if (_.isArray(input)) {
          collector[paramName] = (formatter || _.identity)(_.reduce(
            input, 
            (acc, i) => {
              if (_.isString(i) || _.isNumber(i)) {
                const override = _.get(inputOverrides, i);
                acc[i] = _.isUndefined(override) ? getInput(i) : override;
              } else {
                throw new Error(`input ${i} has invalid type ${typeof i}`);
              }
              return acc;
            },
            {}
          ));
        }
      }
      return collector;
    }, {});
    const generated = _.reduce(params, (collector, {generate}, paramName) => {
      if (generate) {
        collector[paramName] = generate();
      }
      return collector;
    }, {});

    function returnValueBookkeeping(cache, name, collectorArgs, callback) {
      return function(e, r) {
        cacheInsert(cache, name, cacheLifetime, collectorArgs, e, r);
        const formattedResults = formatter ? formatter(r) : r;
        return callback(e, formattedResults);
      };
    }

    function getRecords() {
      const args = Array.prototype.slice.call(arguments);
      if (args.length === 1) {
        const collectorArgs = _.merge({}, literals, inputs, generated);
        const timelyCachedResult = getTimelyCachedResult(cache, name, collectorArgs, cacheLifetime);
        if (timelyCachedResult) {
          return setTimeout(() => {returnValueBookkeeping(cache, null, null, args[0])(timelyCachedResult.e, _.cloneDeep(timelyCachedResult.r))}, 0);
        }
        return recordCollectors[accessSchema.dataSource](accessSchema, collectorArgs, returnValueBookkeeping(cache, name, collectorArgs, args[0]));
      }
      const dependencies = _.reduce(paramNamesToRequirements, (collector, source, paramName) => {
        paramDeps = _.cloneDeep(_.at(args[0], source));
        const sourceNames = _.isString(source) ? [source] : source;
        collector[paramName] = formatters[paramName](_.fromPairs(_.zip(sourceNames, paramDeps)));
        return collector;
      }, {});
      const collectorArgs = _.merge({}, literals, generated, dependencies);
      const timelyCachedResult = getTimelyCachedResult(cache, name, collectorArgs, cacheLifetime);
      if (timelyCachedResult) {
        return setTimeout(() => {returnValueBookkeeping(cache, null, null, args[1])(timelyCachedResult.e, _.cloneDeep(timelyCachedResult.r))}, 0);
      }
      return recordCollectors[accessSchema.dataSource](accessSchema, collectorArgs, returnValueBookkeeping(cache, name, collectorArgs, args[1]));
    }

    requirements.push(getRecords);
    autoArgs[name] = requirements.length === 1 ? requirements[0] : requirements;
    return autoArgs;
  }

  // TODO: the cache tries to be memory-efficient by replacing older cached
  // results with newer ones. However, it identifies relevant cached results
  // using the name of the dependency and the parameters passed to the dependency.
  // And it does not explicitly clear expired cached items except by replacing them
  // with newer items that match both name and params. This means that the cache for
  // items that include a constantly-changing param, for instance the current time,
  // will continually expand.
  function cacheInsert(cache, name, cacheLifetime, collectorArgs, e, r) {
    if (name && cacheLifetime && r && !e) {
      cache[name] = cache[name] || [];
      const existingCachedResult = _.find(cache[name], (result) => {
        return _.isEqual(result.collectorArgs, collectorArgs);
      });
      if (existingCachedResult) {
        existingCachedResult.time = Date.now();
        existingCachedResult.e = e;
        existingCachedResult.r = _.cloneDeep(r);
        return;
      } else {
        return cache[name].push({
          collectorArgs: _.cloneDeep(collectorArgs),
          time: Date.now(),
          e, r
        });
      }
    }
  }

  function getTimelyCachedResult(cache, name, collectorArgs, cacheLifetime) {
    if (!_.isNumber(cacheLifetime)) {return;}
    return _.find(cache[name], (item) => {
      return _.isEqual(collectorArgs, item.collectorArgs) && (Date.now() - item.time) < cacheLifetime;
    });
  }

  function report() {
    validate(dataDependencies, getInputs());
    const selfArgs = Array.prototype.slice.call(arguments);
    const inputOverrides = selfArgs.length > 2 ? selfArgs[1] : null;
    const target = selfArgs.length > 1 ? selfArgs[0] : null;
    const callback = selfArgs[selfArgs.length - 1] || display;
    autoArgs = {};
    if (!target) {
      _.each(dataDependencies, _.partial(addToAutoArgs, autoArgs, inputOverrides));
      return async.auto(autoArgs, callback);
    }
    if (!_.isArray(target) && (!_.isString(target) && !_.isNumber(target))) {
      throw new Error(`Bad target: ${target} for dataDependencies: ${dataDependencies}`);
    } else if (_.isArray(target)) {
      _.each(target, (t) => addToAutoArgs(autoArgs, inputOverrides, dataDependencies[t], t));
    } else {
      addToAutoArgs(autoArgs, inputOverrides, dataDependencies[target], target);
    }
    return async.auto(autoArgs, callback);
  }

  function getCache() { return _.cloneDeep(cache); }

  return {report, getCache, setInput, getInput, getInputs};
}

module.exports = {
  Gopher
};
