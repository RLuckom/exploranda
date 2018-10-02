const exploranda = require('../lib/reporter');
const {instancesBuilder} = exploranda.dataSources.google.compute;
const {timeSeriesBuilder} = exploranda.dataSources.google.stackdriverMonitoring;

/* USAGE: node ./instancesJsonGcp.js <path-to-service-account-credential-json> <name-of-instance>
 *
 * This example lists instances and gets disk write ops for a named instance passed as an argument.
 * It requires a JSON file of service account credentials as described in 
 * https://cloud.google.com/docs/authentication/production
 */

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
  startTime: {generate: () => new Date(Date.now() - 1000 * 60 * 60)},
  endTime: {generate: () => new Date()}
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
