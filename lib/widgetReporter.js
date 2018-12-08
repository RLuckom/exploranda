const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');

const {Gopher} = require('../lib/composer');
const dataSources = require('./dataSources');

const widgetHelpers = {
  table: {
    builder: (screen, grid, schema, data) => {
      const columnWidth = _(data)
        // rotate
        .unzip()
        // convert the elements of the columns to their length, adding 2 for spacing
        .map((row) => _(row).map((el) => (_.isUndefined(el) ? '' : el).toString().length + 2).value())
        // take the length of the longest elemeni in each row. This is the width of the row.
        .map(_.max)
        .value();
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.table,
        {
          label: schema.title,
          fg: _.get(schema, 'displayOptions.fg') || 'white',
          selectedBg: _.get(schema, 'displayOptions.selectedBg') || 'black',
          columnSpacing: 1,
          columnWidth
        }
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      widget.setData({headers: tableData[0], data: tableData.slice(1)});
    }
  },
  markdown: {
    builder: (screen, grid, schema, data) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.markdown,
        {label: schema.title}
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      widget.setMarkdown(data.slice(1).join('\n'));
    }
  },
  donut: {
    builder: (screen, grid, schema, data) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.donut,
        {
          label: schema.title,
          radius: _.get(schema, 'displayOptions.radius') || 10,
          arcWidth: _.get(schema, 'displayOptions.arcWidth') || 4
        }
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      widget.setData(data);
    }
  },
  line: {
    builder: (screen, grid, schema, data) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.line,
        {
          label: schema.title,
          style: {
            line: _.get(schema, 'displayOptions.lineColor') || 'cyan',
            text: _.get(schema, 'displayOptions.textColor') || 'green',
            baseline: _.get(schema, 'displayOptions.baselineColor') || 'white'
          },
          legend: {width: 16},
          maxY: _.get(schema, 'displayOptions.maxY'),
          minY: _.get(schema, 'displayOptions.minY'),
          xLabelPadding: _.get(schema, 'displayOptions.xLabelPadding') || 3,
          xPadding: _.get(schema, 'displayOptions.xPadding') || 0,
          showLegend: _.isUndefined(_.get(schema, 'displayOptions.showLegend')) ? true : schema.displayOptions.showLegend,
          wholeNumbersOnly: _.get(schema, 'displayOptions.wholeNumbersOnly')
        }
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      _.each(data, (ld) => ld.title = ld.title || '');
      widget.setData(data);
    }
  },
  bar: {
    builder: (screen, grid, schema, data) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.bar,
        {
          label: _.get(schema, 'displayOptions.title'),
          barWidth: _.get(schema, 'displayOptions.barWidth') || 2,
          barSpacing: _.get(schema, 'displayOptions.barSpacing') || 2,
          xOffset: _.get(schema, 'displayOptions.xOffset') || 2,
          maxHeight: _.get(schema, 'displayOptions.maxHeight') || _.max(data.data)
        }
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      widget.setData(data);
    }
  },
  stackedBar: {
    builder: (screen, grid, schema, data) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.stackedBar,
        {
          label: schema.title,
          barWidth: _.get(schema, 'displayOptions.barWidth') || 2,
          barSpacing: _.get(schema, 'displayOptions.barSpacing') || 2,
          xOffset: _.get(schema, 'displayOptions.xOffset') || 2,
          barBgColor: data.barBgColor,
          maxHeight: _.get(schema, 'displayOptions.maxHeight') || _.max(data.data)
        }
      );
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: (widget, data) => {
      widget.setData(data);
    }
  },
};

function widgetDashboard({dataDependencies, display}) {
  const gopher = new Gopher(dataDependencies);
  const screen = blessed.screen();
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
  const grid = new contrib.grid(_.merge({rows: 12, cols: 12, screen}, display.gridOptions));
  _.each(display.widgets, (schema, name) => {
    let widget;
    function update(err, data) {
      const widgetData = schema.transformation(data);
      widget = widget || widgetHelpers[schema.displayType].builder(screen, grid, schema, widgetData);
      widgetHelpers[schema.displayType].updater(widget, widgetData);
      screen.render();
    }
    const jitter = Math.floor(Math.random() * 5000);
    setTimeout(() => {
      setInterval(() => {gopher.report(schema.source, update);}, schema.refreshInterval);
    }, jitter);
  });
}

module.exports = {widgetDashboard};
