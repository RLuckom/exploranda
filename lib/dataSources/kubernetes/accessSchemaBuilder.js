const _ = require('lodash');

function kubernetesAccessSchemaBuilder({name, valuePath, path, requiredParams, pathParamKeys}) {
  const accessSchema = {
    dataSource: 'GENERIC_API',
    name,
    value: {
      path: (res) => {
        return valuePath ? _.get(res.body, valuePath) : res.body;
      }
    },
    path,
    params: {},
    requiredParams: _.reduce(requiredParams, (acc, n) => {
      acc[n] = {};
      return acc;
    }, {}),
    pathParamKeys,
    queryParamKeys: ['limit', 'fieldSelector', 'continue'],
    incompleteIndicator: 'body.metadata.continue',
    nextBatchParamConstructor: (params, resp) => {
      return _.merge({}, params, {'continue': resp.body.metadata.continue});
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
    path: `${pathPrefix}/namespaces/` + "${namespace}" + `/${resourceType}/` + "${name}",
    requiredParams: ['apiConfig','namespace', 'name'],
    pathParamKeys: ['namespace', 'name'],
  });

  const namespaceList = kubernetesAccessSchemaBuilder({
    name: `namespace${resourceType}`, 
    valuePath: 'items',
    path: `${pathPrefix}/namespaces/` + "${namespace}" + `/${resourceType}`,
    requiredParams: ['apiConfig', 'namespace'],
    pathParamKeys: ['namespace']
  });

  const allNamespaceList = kubernetesAccessSchemaBuilder({
    name: `allNamespace${resourceType}`, 
    valuePath: 'items',
    path: `/api/v1/${resourceType}`,
    requiredParams: ['apiConfig'],
  });

  return {read, namespaceList, allNamespaceList};
}

function nonNamespacedReadListAccessSchemas(pathPrefix, resourceType) {

  const read = kubernetesAccessSchemaBuilder({
    name: `${resourceType}`, 
    path: `${pathPrefix}/${resourceType}/` + "${name}",
    requiredParams: ['apiConfig', 'name'],
    pathParamKeys: ['name']
  });

  const list = kubernetesAccessSchemaBuilder({
    name: `namespace${resourceType}`, 
    valuePath: 'items',
    path: `${pathPrefix}/${resourceType}`,
    requiredParams: ['apiConfig'],
  });

  return {read, list};
}

module.exports = {kubernetesAccessSchemaBuilder, readListAccessSchemas, nonNamespacedReadListAccessSchemas};
