const exploranda = require('../lib/reporter');
const _ = require('lodash');
const moment = require('moment');

const commit = process.argv[2];

const dependencies = {
  commits: {
    accessSchema: exploranda.dataSources.github.commits.accessSchema,
    params: {
      owner: {value: 'RLuckom'},
      repo: {value: 'exploranda'}
    }
  },
  releases: {
    accessSchema: exploranda.dataSources.npm.releases.accessSchema,
    params: {
      package: {
        input: 'library',
        formatter: ({library}) => library
      }
    }
  },
};

exploranda.widgetDashboard({
  dataDependencies: dependencies,
  inputs: {
    library: 'exploranda'
  },
  display: {
    widgets: {
      releases: {
        title: '%library releases %time',
        source: 'releases',
        usesInputKeys: 'library',
        displayType: 'markdown',
        position: {
          column: 0,
          row: 0,
          rowSpan: 12,
          columnSpan: 6
        },
        transformation: ({releases}) => _.concat([null], _.map(releases[0].versions, 'version'))
      },
      input: {
        title: 'input',
        displayType: 'textBox',
        inputKeys: 'library',
        position: {
          column: 6,
          row: 0,
          rowSpan: 12,
          columnSpan: 6
        },
      }
    }
  }
});
