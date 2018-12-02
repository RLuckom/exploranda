const {Gopher} = require('../lib/composer');
const {tables} = require('../lib/tables');
const {dashboard} = require('../lib/dashboard');
const dataSources = require('./dataSources');
const _ = require('lodash');

function Reporter() {
  const self = this;

  self.stages = {
    gopher: Gopher,
    transformation: tables,
    display: dashboard
  };

  self.schemas = {};

  function setStageExecutors({gopher, transformation, display}) {
    self.stages.gopher = _.isUndefined(gopher) ? stages.gopher : gopher;
    self.stages.transformation = _.isUndefined(transformation) ? stages.transformation : transformation;
    self.stages.display = _.isUndefined(display) ? stages.display : display;
  }

  function setSchemas({dependencies, transformation, display}) {
    self.schemas.dependencies = dependencies;
    self.schemas.transformation = transformation;
    self.schemas.display = display;
  }

  function execute(finalCallback) {
    const displayExecutor = (self.schemas.display && self.stages.display) || function(schema, getTables) {
      getTables(finalCallback || function(e, r) {
        if (e) {return console.log(e);}
        return console.log(JSON.stringify(r, null, 2));
      });
    };
    const transformationExecutor = (self.schemas.transformation && self.stages.transformation) || function(schema, source) {
      return source;
    };
    const gopher = (self.schemas.dependencies && self.stages.gopher) || function(schema, callback) {
      return callback('No executor specified for dependency stage');
    };
    return displayExecutor(self.schemas.display, (callback) => {
      return new gopher(self.schemas.dependencies).report((e, r) => {
        if (e) {return callback(e);}
        return callback(e, transformationExecutor(self.schemas.transformation, r));
      });
    });
  }

  return {
    setStageExecutors,
    setSchemas,
    execute,
  };
}

module.exports = {
  Reporter,
  dataSources,
  dashboard,
  Gopher,
  tables,
};
