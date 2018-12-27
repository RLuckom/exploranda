const _ = require('lodash');

function kubernetesAccessSchemaBuilder({name, valuePath, apiMethod, requiredParams}) {
  const accessSchema = {
    dataSource: 'KUBERNETES',
    name,
    value: {
      path: (res) => {
        return valuePath ? _.get(res, valuePath) : res;
      }
    },
    apiMethod,
    requiredParams: _.reduce(requiredParams, (acc, n) => {
      acc[n] = {};
      return acc;
    }, {}),
    incompleteIndicator: 'metadata.continue',
    nextBatchParamConstructor: (params, resp) => {
      return _.merge({}, params, {'?continue': resp.metadata.continue});
    }
  };

  function builder() {
    const args = Array.prototype.slice.call(arguments);
    const params = _.reduce(requiredParams, (acc, v, i) => {
      acc[v] = args[i];
      return acc;
    }, {});
    return {accessSchema, params};
  };
  return {accessSchema, builder};
}

function readListAccessSchemas(pathPrefix, resourceType) {

  const read = kubernetesAccessSchemaBuilder({
    name: `${resourceType}`, 
    apiMethod: `${pathPrefix}/namespaces/` + "${namespace}" + `/${resourceType}/` + "${name}",
    requiredParams: ['apiConfig', 'namespace', 'name']
  });

  const namespaceList = kubernetesAccessSchemaBuilder({
    name: `namespace${resourceType}`, 
    valuePath: 'items',
    apiMethod: `${pathPrefix}/namespaces/` + "${namespace}" + `/${resourceType}`,
    requiredParams: ['apiConfig', 'namespace']
  });

  const allNamespaceList = kubernetesAccessSchemaBuilder({
    name: `allNamespace${resourceType}`, 
    valuePath: 'items',
    apiMethod: `/api/v1/${resourceType}`,
    requiredParams: ['apiConfig']
  });

  return {read, namespaceList, allNamespaceList};
}

function nonNamespacedReadListAccessSchemas(pathPrefix, resourceType) {

  const read = kubernetesAccessSchemaBuilder({
    name: `${resourceType}`, 
    apiMethod: `${pathPrefix}/${resourceType}/` + "${name}",
    requiredParams: ['apiConfig', 'name']
  });

  const list = kubernetesAccessSchemaBuilder({
    name: `namespace${resourceType}`, 
    valuePath: 'items',
    apiMethod: `${pathPrefix}/${resourceType}`,
    requiredParams: ['apiConfig']
  });

  return {read, list};
}

module.exports = {kubernetesAccessSchemaBuilder, readListAccessSchemas, nonNamespacedReadListAccessSchemas};
