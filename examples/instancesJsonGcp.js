const _ = require('lodash');
const exploranda = require('../lib/reporter');
const {instancesBuilder} = exploranda.dataSources.google.compute;
const {timeSeriesBuilder} = exploranda.dataSources.google.stackdriverMonitoring;
const {logEntriesBuilder} = exploranda.dataSources.google.stackdriverLogging;

/* USAGE: node ./instancesJsonGcp.js <path-to-service-account-credential-json> <name-of-instance> <projectId>
 *
 * This example lists instances and graphs disk write ops for a named instance passed as an argument.
 * It requires a JSON file of service account credentials as described in 
 * https://cloud.google.com/docs/authentication/production
 */

const keyFilename = process.argv[2];
const instanceName = process.argv[3];
const projectName = process.argv[4];

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
      instances: instancesBuilder(apiConfig, projectName, ['us-east1-b', 'us-east1-d']),
      diskWriteOps: timeSeriesBuilder(apiConfig, projectName, sdfilter, sdAgg, interv)
    },
    transformation: {
      'Instances': {
        source: 'instances',
        tableBuilder: (instances) => _.concat([null], _.map(instances, 'name'))
      },
      [`${instanceName} Disk Write Ops`]: {
        source: 'diskWriteOps',
        tableBuilder: (diskWriteOps) => {
          points = _.reverse(diskWriteOps[0].points);
          return [{
            title: `${instanceName} Disk Write Ops`,
            style: {line: 'red'},
            x: _.map(points, 'interval.startTime'),
            y: _.map(points, 'value.doubleValue')
          }];
        },
      }
    },
    display: {
      markdowns: {
        'Instances': {
          column: 0,
          row: 0,
          rowSpan: 12,
          columnSpan: 3
        }
      },
      lines: {
        [`${instanceName} Disk Write Ops`]: {
          column: 3,
          row: 0,
          rowSpan: 12,
          columnSpan: 9
        },
      }
    }
  });
  reporter.execute((e, r) => console.log(JSON.stringify(r, null, 2)));
}

getReport();
