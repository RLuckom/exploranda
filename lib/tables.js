const _ = require('lodash');

function objectToProfileTable({rows}, source) {
  return _.reduce(rows, (collector, rowSelector) => {
    const {heading, value} = selectFromSource(rowSelector, source);
    collector.push([heading, value]);
    return collector;
  }, [['metric', 'value']]);
}

function arrayToRowMajorTable({fields, reverse}, sourceArray) {
  if (reverse) {
    sourceArray = _.reverse(sourceArray);
  }
  const headers = [
    _.map(fields, (field) => {return _.isString(field.heading) ? field.heading : field;})
  ];
  return _.concat(headers,
    _.map(sourceArray, (rowSource) => {
      return _.map(fields, (field) => selectFromSource(field, rowSource).value);
    })
  );
}

function selectFromSource(selector, source) {
  if (!selector) {
    throw new Error(`invalid falsy row selector in ${JSON.stringify(rows)}`);
  }
  let candidate, heading;
  if (_.isString(selector)) {
    heading = selector;
    candidate = _.get(source, selector);
  } else if (_.has(selector, 'selector') && _.isString(selector.heading) || _.isNumber(selector.heading)) {
    heading = selector.heading;
    if (_.isString(selector.selector)) {
      candidate = _.get(source, selector.selector);
    } else if (_.isFunction(selector.selector)) {
      candidate = selector.selector(source);
    } else {
      throw new Error(`invalid selector ${JSON.stringify(selector)}`);
    }
  } else {
    throw new Error(`invalid selector ${JSON.stringify(selector)}`);
  }
  if (candidate && !(_.isString(candidate) || _.isNumber(candidate))) {
    throw new Error(`selector ${JSON.stringify(selector)} returned bad value ${JSON.stringify(candidate)} from ${JSON.stringify(source)}`);
  }
  return {heading, value: candidate};
}

function customTableBuilder({tableBuilder}, source) {
  return tableBuilder(source);
}

function averageMaxTableBuilder(unused, sourceArray) {
  const times = _.map(sourceArray, (point) => point.Timestamp.getMinutes().toString());
  return [{
    title: 'Average',
    style: {line: 'yellow'},
    x: _.cloneDeep(times),
    y: _.map(sourceArray, 'Average'),
  }, {
    title: 'Maximum',
    style: {line: 'red'},
    x: _.cloneDeep(times),
    y: _.map(sourceArray, 'Maximum'),
  }];
}

const tableBuilders = {
  AVERAGE_MAX_LINE: averageMaxTableBuilder,
  CUSTOM: customTableBuilder,
  PROFILE: objectToProfileTable,
  ROW_MAJOR: arrayToRowMajorTable
};

function table(singleTableSchema, source) {
  return {
    type: singleTableSchema.type,
    table: tableBuilders[singleTableSchema.type || 'CUSTOM'](singleTableSchema, source)
  };
}

function transformNames(source, nameMap) {
  return _.transform(nameMap, (collector, nameOnSource, nameOnDest) => {
    collector[nameOnDest] = source[nameOnSource];
  });
}

function tables(reportTableSchema, source) {
  return _.reduce(reportTableSchema, (collector, singleTableSchema, tableName) => {
    let tableSource;
    try {
      const sourceBuilder = _.isString(singleTableSchema.source) ? _.get : (_.isArray(singleTableSchema.source) ? _.pick : transformNames);
      tableSource = _.cloneDeep(sourceBuilder(source, singleTableSchema.source));
      collector[tableName] = table(singleTableSchema, tableSource);
      return collector;
    } catch(err) {
      const s = `Problem building ${tableName} with schema ${JSON.stringify(singleTableSchema)} and source ${JSON.stringify(tableSource)}. Error ${err}`;
      throw new Error(s);
    }
  }, {});
}

function padColumn(columnValueArray) {
  const longest = _.max(_.map(columnValueArray, (v) => (_.isUndefined(v) ? '' : v).toString().length));
  return _.map(columnValueArray, (v) => _.padEnd(v, longest));
}

function tableRowString(rows) {
  return _.reduce(_.unzip(_.map(_.unzip(rows), padColumn)), (collector, row) => {
    return collector + row.join('  ') + '\n';
  }, '');
}

function rowMajorTableString(rows) {
  const printRows = _.cloneDeep(rows);
  printRows.splice(1, 0, _.fill(Array(rows[0].length), ''));
  return tableRowString(printRows);
};

const tableStringFunctions = {
  PROFILE: tableRowString,
  ROW_MAJOR: rowMajorTableString
};

function printTables(tables) {
  return _.map(tables, (table, name) => `\n${name}\n${_.repeat('=', name.length)}\n${tableStringFunctions[table.type](table.table)}`).join('\n');
}

module.exports = {
  tables,
  tableBuilders,
  printTables
};
