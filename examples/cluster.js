const _ = require('lodash');
const exploranda = require('../lib/reporter');
const {ec2MetricsBuilder} = exploranda.dataSources.AWS.ec2;
const {ecsMetricsBuilder, clusterContainerInstanceArnsBuilder, servicesInClusterBuilder, clusterBuilder, clusterServiceArnsBuilder, containerInstancesByClusterBuilder} = exploranda.dataSources.AWS.ecs;
const parseArgs = require('minimist');
const args = parseArgs(process.argv.slice(1));
const clusterName = args._[1];
const keyColors = {};

const apiConfig = {
  region: 'us-east-1'
};

function getKeyColor(key) {
  if (!keyColors[key]) {
    keyColors[key] = [Math.random() * 255,Math.random()*255, Math.random()*255];
  }
  return keyColors[key];
}

function metricTable(source, selector) {
  return function(metricName, statisticName) {
    return {
      source: [source, metricName],
      tableBuilder: (params) => {
        const ids = _.map(params[source], selector);
        return _.filter(_.map(_.zip(ids, params[metricName]), ([ip, metricArray]) => {
          metricArray = _.sortBy(metricArray, 'Timestamp');
          return {
            title: ip,
            style: {line: getKeyColor(ip)},
            x: _.map(metricArray, (point) => point.Timestamp.getMinutes().toString()),
            y: _.map(metricArray, statisticName)
          };
        }), (line) => line.x.length);
      }
    };
  }
}

const clusterInstanceMetricTable = metricTable('clusterInstances', 'ec2InstanceId');
const clusterServiceMetricTable = metricTable('clusterServices', 'serviceName');

function ec2MetricDependency(source, dimensionName, selector, extraDimensions) {
  return function(metricName, statistics) {
    return ec2MetricsBuilder(apiConfig,
      {value: metricName},
      {value: statistics},
      {
        source,
        formatter: (instances) => {
          const ids = _.map(instances, selector);
          const insts = _.map(ids, (id) => {
            return _.concat([{Name: dimensionName, Value: id}], extraDimensions || []);
          });
          return insts;
        }
      }
    );
  };
}

function ecsMetricDependency(source, dimensionName, selector, extraDimensions) {
  return function(metricName, statistics) {
    return ecsMetricsBuilder(apiConfig,
      {value: metricName},
      {value: statistics},
      {
        source,
        formatter: (instances) => {
          const ids = _.map(instances, selector);
          return _.map(ids, (id) => {
            return _.concat([{Name: dimensionName, Value: id}], extraDimensions || []);
          });
        }
      }
    );
  };
}

const clusterInstanceMetricDependency = ec2MetricDependency('clusterInstances', 'InstanceId', 'ec2InstanceId');
const clusterServiceMetricDependency = ecsMetricDependency('clusterServices', 'ServiceName', 'serviceName', [{Name: 'ClusterName', Value: clusterName}]);

const display = {
  lines: {
    [`${clusterName} Instance Network Packets In`]: place(0, 0, 4, 6),
    [`${clusterName} Instance Network Packets Out`]: place(0, 4, 4, 6),
    [`${clusterName} Instance CPU Utilization`]: place(0, 8, 4, 6),
    [`${clusterName} Service CPU Utilization`]: place(6, 0, 4, 6), 
    [`${clusterName} Service Memory Utilization`]: place(6, 4, 4, 6),
  },
  tables: {
    [`${clusterName} Services`]: place(6, 8, 4, 4),
  }
};

function place(column, row, rowSpan, columnSpan) {
  return {column, row, rowSpan, columnSpan};
}

function serviceElementRowTable(source) {
  return {
    // Each element corresponds to a row. The table will be an array of arrays,
    // each representing one row. The first row will be the headings.
    type: 'ROW_MAJOR',
    source: source,
    fields: [
      {
        heading: 'name',
        selector: 'serviceName',
      }, {
        heading: 'status',
        selector: 'status'
      }, {
        heading: 'desired',
        selector: 'desiredCount'
      }, {
        heading: 'running',
        selector: 'runningCount'
      }, {
        heading: 'pending',
        selector: 'pendingCount'
      },
    ]
  };
}

const clusterServicesDep = servicesInClusterBuilder(apiConfig, {value: clusterName}, {source: 'clusterServiceArns'});

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies: {
      cluster: clusterBuilder(apiConfig, {value: [clusterName]}), 
      clusterServiceArns: clusterServiceArnsBuilder(apiConfig, {value: clusterName}),
      clusterContainerInstanceArns: clusterContainerInstanceArnsBuilder(apiConfig, {value: clusterName}),
      clusterServices: servicesInClusterBuilder(apiConfig,{value: clusterName}, {source: 'clusterServiceArns'}),
      clusterInstances: containerInstancesByClusterBuilder(apiConfig,{value: clusterName}, {source: 'clusterContainerInstanceArns'}),
      instanceNetworkIn: clusterInstanceMetricDependency('NetworkPacketsIn', ['Average']),
      instanceNetworkOut: clusterInstanceMetricDependency('NetworkPacketsOut', ['Average']),
      instanceCpu: clusterInstanceMetricDependency('CPUUtilization', ['Maximum']),
      serviceCpu: clusterServiceMetricDependency('CPUUtilization', ['Maximum']),
      serviceMemory: clusterServiceMetricDependency('MemoryUtilization', ['Maximum']),
    },
    transformation: {
      [`${clusterName} Instance Network Packets In`]: clusterInstanceMetricTable('instanceNetworkIn', 'Average'),
      [`${clusterName} Services`]: serviceElementRowTable('clusterServices'),
      [`${clusterName} Instance Network Packets Out`]: clusterInstanceMetricTable('instanceNetworkOut', 'Average'),
      [`${clusterName} Instance CPU Utilization`]: clusterInstanceMetricTable('instanceCpu', 'Maximum'),
      [`${clusterName} Service CPU Utilization`]: clusterServiceMetricTable('serviceCpu', 'Maximum'),
      [`${clusterName} Service Memory Utilization`]: clusterServiceMetricTable('serviceMemory', 'Maximum'),
    },
    display
  });
  reporter.execute();
}

getReport();
