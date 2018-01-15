const IAMNamespaceDetails = {
  name: 'IAM',
  constructorArgs: {
  }
};

const role = {
  dataSource: 'AWS',
  name: 'IAMRole',
  namespaceDetails: IAMNamespaceDetails,
  value: {
    path: 'Role',
  },
  apiMethod: 'getRole',
  params: {
  },
};

module.exports = {
  role
};
