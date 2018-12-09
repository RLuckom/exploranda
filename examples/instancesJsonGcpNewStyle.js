const _ = require('lodash');
const exploranda = require('../lib/reporter');
const {instancesBuilder} = exploranda.dataSources.google.compute;
const {timeSeriesBuilder} = exploranda.dataSources.google.stackdriverMonitoring;
const {logEntriesBuilder} = exploranda.dataSources.google.stackdriverLogging;

/* USAGE: node ./instancesJsonGcp.js <path-to-service-account-credential-json> <name-of-instance> <id-of-instance> <projectId>
 *
 * This example lists instances and graphs disk write ops for a named instance passed as an argument.
 * It requires a JSON file of service account credentials as described in 
 * https://cloud.google.com/docs/authentication/production
 */

const keyFilename = process.argv[2];
const instanceName = process.argv[3];
const instanceId = process.argv[4];
const projectId = process.argv[5];

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

const resourceNames = {value: [`projects/${projectId}`]};
const filter = {
  value: `resource.type="gce_instance"
resource.labels.instance_id="${instanceId}"`
};

const schema = {
  dataDependencies: {
    instances: instancesBuilder(apiConfig, projectId, ['us-east1-b', 'us-east1-d']),
    diskWriteOps: timeSeriesBuilder(apiConfig, projectId, sdfilter, sdAgg, interv),
    logEntries: logEntriesBuilder(apiConfig, resourceNames, filter)
  },
  display: {
    gridOptions: {},
    widgets: {
      instances: {
        title: 'Instances   ( t: %time | d: %refreshTime | min: %minRefreshTime | mean: %meanRefreshTime | max: %maxRefreshTime )',
        source: 'instances',
        refreshInterval: 5000,
        transformation: ({instances}) => _.concat([null], _.map(instances, 'name')),
        displayType: 'markdown',
        position: {
          column: 0,
          row: 0,
          rowSpan: 12,
          columnSpan: 3
        },
        displayOptions: {}
      },
      logEntries: {
        title: 'Log Entries',
        source: 'logEntries',
        refreshInterval: 5000,
        transformation: ({logEntries}) => _.concat([null], _.map(logEntries, (line) => JSON.stringify(line))),
        displayType: 'markdown',
        position: {
          column: 3,
          row: 0,
          rowSpan: 12,
          columnSpan: 3
        },
        displayOptions: {}
      },
      writeOpsGraph: {
        title: `${instanceName} Disk Write Ops`,
        source: 'diskWriteOps',
        refreshInterval: 5000,
        transformation: ({diskWriteOps}) => {
          points = _.reverse(_.get(diskWriteOps, '[0].points') || []);
          return [{
            title: `${instanceName} Disk Write Ops`,
            style: {line: 'red'},
            x: _.map(points, 'interval.startTime'),
            y: _.map(points, 'value.doubleValue')
          }];
        },
        displayType: 'line',
        position: {
          column: 6,
          row: 0,
          rowSpan: 12,
          columnSpan: 6
        }
      }
    }
  }
};

exploranda.widgetDashboard(schema);
