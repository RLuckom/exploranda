const _ = require('lodash');

const IAMNamespaceDetails = {
  name: 'IAM',
  constructorArgs: {
  }
};

const instanceProfileList = {
  dataSource: 'AWS',
  name: 'iamInstanceProfileList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'InstanceProfiles',
  },
  params: {
    MaxItems: 50,
    PathPrefix: '/'
  },
  apiMethod: 'listInstanceProfiles',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
};

const groupList = {
  dataSource: 'AWS',
  name: 'iamGroupList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'Groups',
  },
  params: {
    MaxItems: 50,
    PathPrefix: '/'
  },
  apiMethod: 'listGroups',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
};

const userList = {
  dataSource: 'AWS',
  name: 'iamUserList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'Users',
  },
  params: {
    MaxItems: 50,
    PathPrefix: '/'
  },
  apiMethod: 'listUsers',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
};

const roleList = {
  dataSource: 'AWS',
  name: 'iamRoleList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'Roles',
  },
  params: {
    MaxItems: 50,
    PathPrefix: '/'
  },
  apiMethod: 'listRoles',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
};

const policyList = {
  dataSource: 'AWS',
  name: 'iamPolicyList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'Policies',
  },
  apiMethod: 'listPolicies',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
};

const policyAttachedEntityList = {
  dataSource: 'AWS',
  name: 'iamPolicyAttachedEntityList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    // these three are at the top level, return them omitting IsTruncated etc
    path: ({PolicyUsers, PolicyGroups, PolicyRoles}) => {
      return {PolicyUsers, PolicyGroups, PolicyRoles};
    }
  },
  apiMethod: 'listEntitiesForPolicy',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
  requiredParams: {
    PolicyArn: {},
  }
};

const getPolicyVersion = {
  dataSource: 'AWS',
  name: 'getPolicy',
  namespaceDetails: IAMNamespaceDetails,
  apiMethod: 'getPolicyVersion',
  value: {
    path: 'PolicyVersion',
  },
  requiredParams: {
    PolicyArn: {},
    VersionId: {}
  },
};

const userInlinePolicyList = {
  dataSource: 'AWS',
  name: 'iamUserinlinePolicyList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'PolicyNames', 
  },
  apiMethod: 'listUserPolicies',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
  requiredParams: {
    UserName: {},
  },
  mergeIndividual: _.identity,
};

const getUserPolicy = {
  dataSource: 'AWS',
  name: 'getUserPolicy',
  namespaceDetails: IAMNamespaceDetails,
  apiMethod: 'getUserPolicy',
  value: {
    path: ({UserName, PolicyName, PolicyDocument}) => {
      return {UserName, PolicyName, PolicyDocument};
    },
  },
  requiredParams: {
    UserName: {},
    PolicyName: {}
  },
};

function listUserInlinePoliciesBuilder(apiConfig, userNameParam) {
  return {
    accessSchema: userInlinePolicyList,
    params: {
      apiConfig,
      UserName: userNameParam,
    },
  };
}

function getUserInlinePolicyBuilder(apiConfig, userNameParam, policyNameParam) {
  return {
    accessSchema: getUserPolicy,
    params: {
      apiConfig,
      UserName: userNameParam,
      PolicyName: policyNameParam,
    },
    formatter: (versions) => _.map(versions, (v) => {
      v.PolicyDocument = JSON.parse(decodeURIComponent(v.PolicyDocument))
      return v;
    })
  };
}

const groupInlinePolicyList = {
  dataSource: 'AWS',
  name: 'iamGroupinlinePolicyList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'PolicyNames', 
  },
  apiMethod: 'listGroupPolicies',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
  requiredParams: {
    GroupName: {},
  },
  mergeIndividual: _.identity,
};

const getGroupPolicy = {
  dataSource: 'AWS',
  name: 'getGroupPolicy',
  namespaceDetails: IAMNamespaceDetails,
  apiMethod: 'getGroupPolicy',
  value: {
    path: ({GroupName, PolicyName, PolicyDocument}) => {
      return {GroupName, PolicyName, PolicyDocument};
    },
  },
  requiredParams: {
    GroupName: {},
    PolicyName: {}
  },
};

function listGroupInlinePoliciesBuilder(apiConfig, groupNameParam) {
  return {
    accessSchema: groupInlinePolicyList,
    params: {
      apiConfig,
      GroupName: groupNameParam,
    },
  };
}

function getGroupInlinePolicyBuilder(apiConfig, groupNameParam, policyNameParam) {
  return {
    accessSchema: getGroupPolicy,
    params: {
      apiConfig,
      GroupName: groupNameParam,
      PolicyName: policyNameParam,
    },
    formatter: (versions) => _.map(versions, (v) => {
      v.PolicyDocument = JSON.parse(decodeURIComponent(v.PolicyDocument))
      return v;
    })
  };
}

const roleInlinePolicyList = {
  dataSource: 'AWS',
  name: 'iamRoleinlinePolicyList',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'PolicyNames', 
  },
  apiMethod: 'listRolePolicies',
  incompleteIndicator: 'IsTruncated',
  nextBatchParamConstructor: (params, {Marker}) => {
    return _.merge({}, params, {Marker});
  },
  requiredParams: {
    RoleName: {},
  },
  mergeIndividual: _.identity,
};

const getRolePolicy = {
  dataSource: 'AWS',
  name: 'getRolePolicy',
  namespaceDetails: IAMNamespaceDetails,
  apiMethod: 'getRolePolicy',
  value: {
    path: ({RoleName, PolicyName, PolicyDocument}) => {
      return {RoleName, PolicyName, PolicyDocument};
    },
  },
  requiredParams: {
    RoleName: {},
    PolicyName: {}
  },
};

function getPolicyAttachedEntitiesBuilder(apiConfig, policyArnParam) {
  return {
    accessSchema: policyAttachedEntityList,
    params: {
      apiConfig,
      PolicyArn: policyArnParam,
    },
  };
}

function listRoleInlinePoliciesBuilder(apiConfig, roleNameParam) {
  return {
    accessSchema: roleInlinePolicyList,
    params: {
      apiConfig,
      RoleName: roleNameParam,
    },
  };
}

function getRoleInlinePolicyBuilder(apiConfig, roleNameParam, policyNameParam) {
  return {
    accessSchema: getRolePolicy,
    params: {
      apiConfig,
      RoleName: roleNameParam,
      PolicyName: policyNameParam,
    },
    formatter: (versions) => _.map(versions, (v) => {
      v.PolicyDocument = JSON.parse(decodeURIComponent(v.PolicyDocument))
      return v;
    })
  };
}

function getPolicyVersionBuilder(apiConfig, policyArnParam, versionIdParam) {
  return {
    accessSchema: getPolicyVersion,
    params: {
      apiConfig,
      PolicyArn: policyArnParam,
      VersionId: versionIdParam,
    },
    formatter: (versions) => _.map(versions, (v) => {
      v.Document = JSON.parse(decodeURIComponent(v.Document))
      return v;
    })
  };
}

function listUserBuilder(apiConfig) {
  return {
    accessSchema: userList,
    params: {
      apiConfig: {value: apiConfig},
    },
  };
}

function listGroupBuilder(apiConfig) {
  return {
    accessSchema: groupList,
    params: {
      apiConfig: {value: apiConfig},
    },
  };
}

function listInstanceProfileBuilder(apiConfig) {
  return {
    accessSchema: instanceProfileList,
    params: {
      apiConfig: {value: apiConfig},
    },
    formatter: (instanceProfiles) => _.map(instanceProfiles, (p) => {
      _.each(p.Roles, (r) => {
        r.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(r.AssumeRolePolicyDocument))
      });
      return p;
    })
  };
}

function listRoleBuilder(apiConfig) {
  return {
    accessSchema: roleList,
    params: {
      apiConfig: {value: apiConfig},
    },
    formatter: (versions) => _.map(versions, (v) => {
      v.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(v.AssumeRolePolicyDocument))
      return v;
    })
  };
}

function listAttachedPolicyBuilder(apiConfig) {
  return {
    accessSchema: policyList,
    params: {
      OnlyAttached: {value: true},
      apiConfig: {value: apiConfig},
    }
  };
}

module.exports = {
  policyList, listAttachedPolicyBuilder,
  getPolicyVersion, getPolicyVersionBuilder,
  policyAttachedEntityList, getPolicyAttachedEntitiesBuilder,
  roleList, listRoleBuilder,
  userInlinePolicyList, listUserInlinePoliciesBuilder,
  getUserPolicy, getUserInlinePolicyBuilder,
  groupInlinePolicyList, listGroupInlinePoliciesBuilder,
  getGroupPolicy, getGroupInlinePolicyBuilder,
  roleInlinePolicyList, listRoleInlinePoliciesBuilder,
  getRolePolicy, getRoleInlinePolicyBuilder,
  userList, listUserBuilder,
  groupList, listGroupBuilder,
  instanceProfileList, listInstanceProfileBuilder,
};
