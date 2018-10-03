const exploranda = require('../lib/reporter');
const {ec2MetricsBuilder} = exploranda.dataSources.AWS.ec2;
const parseArgs = require('minimist');
const args = parseArgs(process.argv.slice(1));
const instanceId = args._[1];

const apiConfig = {region: 'us-east-1'};

const display = {
  lines: {
    [`${instanceId} Network Packets In`]: {
      column: 0,
      row: 0,
      rowSpan: 6,
      columnSpan: 12
    },
    [`${instanceId} Network Packets Out`]: {
      column: 0,
      row: 6,
      rowSpan: 6,
      columnSpan: 12
    },
  }
};

const transformation = {
  [`${instanceId} Network Packets In`]: {
    source: 'instanceNetworkIn',
    type: 'AVERAGE_MAX_LINE'
  },
  [`${instanceId} Network Packets Out`]: {
    source: 'instanceNetworkOut',
    type: 'AVERAGE_MAX_LINE'
  }
};
const instanceNetworkIn = ec2MetricsBuilder(apiConfig,
  {value: 'NetworkPacketsIn'},
  {value: ['Average', 'Maximum']},
  {value: [{Name: 'InstanceId', Value: instanceId}]}
);

const instanceNetworkOut = ec2MetricsBuilder(apiConfig,
  {value: 'NetworkPacketsOut'},
  {value: ['Average', 'Maximum']},
  {value: [{Name: 'InstanceId', Value: instanceId}]}
);

instanceNetworkOut.formatter = ([inst]) => inst;
instanceNetworkIn.formatter = ([inst]) => inst;

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies: {
      instanceNetworkIn,
      instanceNetworkOut,
    },
    transformation,
    display
  });
  reporter.execute();
}

getReport();
