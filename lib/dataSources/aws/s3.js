const _ = require('lodash');

const namespaceDetails = {
  name: 'S3',
  constructorArgs: {}
};

const listBuckets = {
  dataSource: 'AWS',
  namespaceDetails,
  name: 's3BucketList',
  value: {
    path: 'Buckets',
  },
  apiMethod: 'listBuckets',
  incompleteIndicator: 'NextToken',
  nextBatchParamConstructor: (params, {NextToken}) => {
    return _.merge({}, params, {NextToken});
  },
};

function listBucketBuilder(apiConfig) {
  return {
    accessSchema: listBuckets,
    params: {
      apiConfig: {value: apiConfig}
    }
  };
}

const getBucketAcl = {
  dataSource: 'AWS',
  namespaceDetails,
  name: 's3BucketAcl',
  value: {
    path: _.identity
  },
  apiMethod: 'getBucketAcl',
  requiredParams: {
    Bucket: {}
  },
};

function getBucketAclBuilder(apiConfig, bucketParam) {
  return {
    accessSchema: getBucketAcl,
    params: {
      apiConfig: {value: apiConfig},
      Bucket: bucketParam
    }
  };
}

const getBucketPolicy = {
  dataSource: 'AWS',
  namespaceDetails,
  name: 's3BucketPolicy',
  value: {
    path: _.identity
  },
  apiMethod: 'getBucketPolicy',
  requiredParams: {
    Bucket: {}
  },
  onError: (err, res) => {
    if (err.name === 'NoSuchBucketPolicy') {
      return {err: null, res: {Policy: '{}'}};
    }
    return {err, res};
  }
};

function getBucketPolicyBuilder(apiConfig, bucketParam) {
  return {
    accessSchema: getBucketPolicy,
    params: {
      apiConfig: {value: apiConfig},
      Bucket: bucketParam
    },
    formatter: (policies) => {
      _.each(policies, (p) => {p.Policy = JSON.parse(p.Policy)});
      return policies;
    }
  };
}

const listObjects = {
  dataSource: 'AWS',
  namespaceDetails,
  name: 'listObjectsInBucket',
  value: {
    path: 'Contents',
  },
  apiMethod: 'listObjectsV2',
  requiredParams: {
    Bucket: {}
  },
  mergeIndividual: _.identity,
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {NextContinuationToken}) => {
    return _.merge({}, params, {ContinuationToken: NextContinuationToken});
  }
};

function listObjectsBuilder(apiConfig, bucketParam) {
  return {
    accessSchema: listObjects,
    params: {
      apiConfig: {value: apiConfig},
      Bucket: bucketParam
    }
  };
}

module.exports = {
  listBuckets, listBucketBuilder,
  getBucketAcl, getBucketAclBuilder,
  getBucketPolicy, getBucketPolicyBuilder,
  listObjects, listObjectsBuilder,
};
