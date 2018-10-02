const exploranda = require('../lib/reporter');
const {instancesBuilder} = exploranda.dataSources.google.compute;
const {timeSeriesBuilder} = exploranda.dataSources.google.stackdriverMonitoring;

const keyFilename = process.argv[2];
const instanceName = process.argv[3];

const apiConfig = {keyFilename};

const sdfilter = {value: `metric.type="compute.googleapis.com/instance/disk/write_ops_count" AND metric.labels.instance_name = ${instanceName}`};
const sdAgg = {
  groupByFields: {value: ['project', 'metric.labels.instance_name']},
  crossSeriesReducer: {value: 'REDUCE_SUM'},
  perSeriesAligner: {value:'ALIGN_RATE'},
  alignmentPeriod: {value: '+60s'}
};

const interv = {
  startTime: {value: '2018-10-01T02:11:00Z'},
  endTime: {value: '2018-10-01T03:22:00Z'}
};

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies: {
      instances: instancesBuilder(apiConfig, 'root-217800', ['us-east1-b', 'us-east1-d']),
      ts: timeSeriesBuilder(apiConfig, 'root-217800', sdfilter, sdAgg, interv)
    },
  });
  reporter.execute((e, r) => console.log(JSON.stringify(r, null, 2)));
}

getReport();
