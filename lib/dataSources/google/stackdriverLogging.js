const _ = require('lodash');

const namespaceDetails = {
  name: 'logging',
  constructorArgs: {
    version: 'v2'
  }
};

const logEntries = {
  dataSource: 'GOOGLE',
  name: 'stackdriverLogs',
  namespaceDetails,
  value: {
    path: (res) => {
      return _.get(res, 'data.entries') || [];
    },
  },
  apiMethod: ['entries', 'list'],
  params: {},
  requiredParams: {
    /*Names of one or more parent resources from which to retrieve log entries:
     *
     * "projects/[PROJECT_ID]"
     * "organizations/[ORGANIZATION_ID]"
     * "billingAccounts/[BILLING_ACCOUNT_ID]"
     * "folders/[FOLDER_ID]"
     */
    resourceNames: {
      detectArray: (n) => _.isArray(_.get(n, 0))
    },
  },
  incompleteIndicator: 'nextPageToken',
  nextBatchParamConstructor: (params, instances) => {
    return _.merge(params, {
      pageToken: instances.nextPageToken
    });
  }
};

function logEntriesBuilder(apiConfig, resourceNames, filter) {
  return {
    accessSchema: logEntries,
    params: {
      apiConfig: {value: apiConfig},
      resourceNames,
      // https://cloud.google.com/logging/docs/view/advanced-filters
      // Also note that the log viewer page in the console uses this 
      // API, so if you use the dropdowns there to view the logs you
      // want, the network tab will show you the filter.
      filter,
    }
  };
}

module.exports = {
  logEntries, logEntriesBuilder
};
