const _ = require('lodash');
const {docker} = require('../lib/dataSources');
const exploranda = require('../lib/reporter');

const repos = [
  'library/elasticsearch',
  'library/ubuntu',
  'library/alpine',
];

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies: {
      dockerAuth: docker.authBuilder(
          {value: 'auth.docker.io'},
          {value: '/token'},
          {value: _.map(repos, (r) => `repository:${r}:pull`)},
          {value: 'registry.docker.io'}
      ),
      tags: docker.tagsBuilder(
          {value: 'registry-1.docker.io'},
          {value: _.map(repos, (r) => `/v2/${r}/tags/list`)},
          {
            source: 'dockerAuth',
            formatter: ({dockerAuth}) => _.map(dockerAuth, 'body')
          }
      ),
    },
  });
  reporter.execute((e, r) => console.log(JSON.stringify(r, null, 2)));
}

getReport();
