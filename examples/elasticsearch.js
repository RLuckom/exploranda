const exploranda = require('../lib/reporter');
const es = exploranda.dataSources.elasticsearch;
const {simpleRequestDependencyBuilder} = exploranda.dataSources.request;
const parseArgs = require('minimist');
const _ = require('lodash');

const args = parseArgs(process.argv.slice(1));
const esHost = args._[1];

const dependencies = {
  nodeStats: {
    accessSchema: es.nodeStats,
    params: {
      esHost: {value: esHost}
    },
  },
  indexStats: {
    accessSchema: es.indexStats,
    params: {
      esHost: {value: esHost}
    },
  },
  shardStats: simpleRequestDependencyBuilder(
    {url: `${esHost}/_cat/shards?format=json`, json: true}
  ),
};

function tryPaths(o, paths) {
  return _.find(_(paths).map((p) => _.get(o, p)).value());
}

function nodeStatsDonutTable(calculator) {
  return {
    type: 'CUSTOM',
    source: 'nodeStats',
    tableBuilder: (nodeStats) => {
      const perNode = _.reduce(nodeStats.nodes, (collector, stats, hash) => {
        collector.push({
          label: stats.host || 'unknown', 
          percent: calculator(stats)
        });
        return collector;
      }, []);
      return _.sortBy(perNode, 'label');
    }
  };
}

function nodeStatsBarChartTable(calculator) {
  return {
    type: 'CUSTOM',
    source: 'nodeStats',
    tableBuilder: (nodeStats) => {
      const perNode = _.reduce(nodeStats.nodes, (collector, stats, hash) => {
        collector.push({
          title: stats.host || 'unknown', 
          docs: calculator(stats)
        });
        return collector;
      }, []);
      const pairs = _.sortBy(perNode, 'title');
      return {
        titles: _.map(pairs, 'title'),
        data: _.map(pairs, 'docs')
      };
    }
  };
}

function shardHealthStackedBar({indexStats, shardStats}) {
  const indexStatus = _.reduce(indexStats.indices, (collector, stat, name) => {
    collector[name] = stat.status;
    return collector;
  }, {});
  const ips = _(shardStats).map('ip').uniq().sort().value();
  const ipPositions = {};
  const redYellowGreenTotals = _.reduce(ips, (collector, ip, indx) => {
    ipPositions[ip] = indx;
    collector.push([0, 0, 0]);
    return collector;
  }, []);
  const colors = {red: 0, yellow: 1, green: 2};
  _.each(shardStats, (shard) => {
    redYellowGreenTotals[ipPositions[shard.ip]][colors[indexStatus[shard.index]]]++;
  });
  return {
    barBgColor: ['red', 'yellow', 'green'],
    barCategory: ips,
    stackedCategory: ['red', 'yellow', 'green'],
    data: redYellowGreenTotals
  };
}

const transformation = {
  'Elasticsearch Node Disk Space Used': nodeStatsDonutTable(
    (stats) => _.round((stats.fs.total.total_in_bytes - stats.fs.total.free_in_bytes) / stats.fs.total.total_in_bytes * 100, 1)
  ),
  'Elasticsearch Node Heap Space Used': nodeStatsDonutTable(
    (stats) =>  stats.jvm.mem.heap_used_percent
  ),
  'Elasticsearch Node Memory Used': nodeStatsDonutTable(
    (stats) => stats.os.mem.used_percent
  ),
  'Elasticsearch Node Swap Used': nodeStatsDonutTable(
    (stats) => stats.os.swap.used_in_bytes / stats.os.swap.total_in_bytes * 100
  ),
  'Elasticsearch Node Document Distribution': nodeStatsBarChartTable(
    (stats) => stats.indices.docs.count
  ),
  'Elasticsearch Node Load': nodeStatsBarChartTable(
    (stats) => tryPaths(stats, ['os.load_average', 'os.cpu.load_average.1m'])
  ),
  'Elasticsearch Shards By Index Health': {
    type: 'CUSTOM',
    source: ['indexStats', 'shardStats'],
    tableBuilder: shardHealthStackedBar
  },
  'Elasticsearch Index Status Distribution': {
    type: 'CUSTOM',
    source: 'indexStats',
    tableBuilder: (indexStats) => {
      const perIndex = _.reduce(_.countBy(indexStats.indices, 'status'), (collector, n, status) => {
        collector.push({
          title: status,
          indices: n
        });
        return collector;
      }, []);
      const pairs = _.sortBy(perIndex, 'title');
      return {
        titles: _.map(pairs, 'title'),
        data: _.map(pairs, 'indices')
      };
    },
  }
};

const display = {
  lines: {},
  markdowns: {},
  tables: {},
  donuts: {
    'Elasticsearch Node Disk Space Used': {
      column: 0,
      row: 0,
      rowSpan: 2,
      columnSpan: 6
    },
    'Elasticsearch Node Memory Used': {
      column: 0,
      row: 2,
      rowSpan: 2,
      columnSpan: 6
    },
    'Elasticsearch Node Swap Used': {
      column: 0,
      row: 4,
      rowSpan: 2,
      columnSpan: 6
    },
    'Elasticsearch Node Heap Space Used': {
      column: 0,
      row: 6,
      rowSpan: 2,
      columnSpan: 6
    },
  },
  bars:{
    'Elasticsearch Node Load': {
      barWidth: 13,
      column: 6,
      row: 2,
      rowSpan: 2,
      columnSpan: 6
    },
    'Elasticsearch Node Document Distribution': {
      barWidth: 13,
      column: 6,
      row: 0,
      rowSpan: 2,
      columnSpan: 6
    },
    'Elasticsearch Index Status Distribution': {
      barWidth: 9,
      column: 6,
      row: 6,
      rowSpan: 2,
      columnSpan: 6
    },
  },
  stackedBars: {
    'Elasticsearch Shards By Index Health': {
      barWidth: 13,
      column: 0,
      row: 8,
      rowSpan: 4,
      columnSpan: 12
    }
  }
};

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies,
    transformation,
    display
  });
  reporter.execute();
}

getReport();
