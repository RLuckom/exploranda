const _ = require('lodash'); // I know I'm going to need it

const repoAccessSchema = {
  name: 'GithubRepo',
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}',
  value: {path: 'body'},
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  headerParamKeys: ['User-Agent'],
};

const commitsAccessSchema = {
  name: 'GithubRepoCommits',
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}/commits',
  incompleteIndicator: 'headers.link.next',
  nextBatchParamConstructor: (currentParameters, response) => {
    const next = response.headers.link.next;
    const nextParams = {
      apiConfig: {
        host: next.url.host,
        path: next.url.pathName,
      },
      page: next.page
    };
    return _.merge({}, currentParameters, nextParams)
  },
  value: {path: 'body'},
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  queryParamKeys: ['page'],
  headerParamKeys: ['User-Agent'],
};

module.exports = {
  repo: {accessSchema: repoAccessSchema},
  commits: {accessSchema: commitsAccessSchema},
};
