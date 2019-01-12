const npmReleasesAccessSchema = {
  name: 'npmPackage',
  dataSource: 'GENERIC_API',
  value: {path: 'body'},
  host: 'registry.npmjs.org',
  path: '/${package}',
  requiredParams: {
    package: {}
  },
  pathParamKeys: ['package'],
};

const npmDownloadsAccessSchema = {
  name: 'npmPackageTotalDownloadCounts',
  dataSource: 'GENERIC_API',
  value: {path: 'body'},
  host: 'api.npmjs.org',
  path: '/downloads/point/${range}/${package}',
  requiredParams: {
    package: {},
    range: {}
  },
  pathParamKeys: ['package', 'range'],
};

module.exports = {
  releases: {accessSchema: npmReleasesAccessSchema},
  downloadCounts: {accessSchema: npmDownloadsAccessSchema},
}
