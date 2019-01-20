const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');
const moment = require('moment');

const {Gopher} = require('../lib/composer');
const dataSources = require('./dataSources');

const widgetHelpers = {
  table: {
    builder: ({screen, grid, schema, data}) => {
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
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setData({headers: data[0], data: data.slice(1)});
    }
  },
  markdown: {
    builder: ({screen, grid, schema, data}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.markdown,
        {label: schema.title}
      );
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setMarkdown(data.slice(1).join('\n'));
    }
  },
  donut: {
    builder: ({screen, grid, schema, data}) => {
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
      setWidgetProperties(widget, schema);
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setData(data);
    }
  },
  line: {
    builder: ({screen, grid, schema, data}) => {
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
      setWidgetProperties(widget, schema);
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      _.each(data, (ld) => ld.title = ld.title || '');
      widget.setData(data);
    }
  },
  bar: {
    builder: ({screen, grid, schema, data}) => {
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
      setWidgetProperties(widget, schema);
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setData(data);
    }
  },
  stackedBar: {
    builder: ({screen, grid, schema, data}) => {
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
      setWidgetProperties(widget, schema);
      return widget;
    },
    updater: ({widget, data, metadata, inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setData(data);
    }
  },
  textBox: {
    builder: ({screen, grid, schema, setInput}) => {
      const input = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.textbox,
        {
          label: schema.title,
          inputOnFocus: true,
          focusable: true,
        }
      );
      screen.render();
      input.set('keyable', true);
      input.on('submit', () => {
        setInput(schema.inputKeys, input.getValue());
      });
      return input;
    }
  }
};

function setWidgetProperties(widget, schema) {
  widget.set('exploranda_name', schema.title);
  widget.set('exploranda_timeFormat', schema.timeFormat);
}

function updateMetadata(widget, metadata, inputFields) {
  const time = metadata.displayTime.format(widget.get('exploranda_timeFormat') || 'h:mm:ss');
  const label = _.chain(_.merge({time}, metadata, inputFields)).reduce(
    (acc, v, k) => {
      return _.replace(acc, `%${k}`, v);
    }, widget.get('exploranda_name', '')
  ).value();
  widget.setLabel(label);
  return widget;
}

function getInputFields(getInput, usesInputKeys) {
  if (_.isString(usesInputKeys) || _.isNumber(usesInputKeys)) {
    return {[usesInputKeys]: getInput(usesInputKeys)};
  } else if (_.isArray(usesInputKeys)) {
    return _.reduce(usesInputKeys, (acc, key) => {
      acc[key] = getInput(key);
      return acc;
    }, {});
  } else {
    return _.cloneDeep(usesInputKeys)
  }
}

function widgetDashboard({dataDependencies, inputs, display}) {
  const gopher = new Gopher(dataDependencies, inputs);
  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    ignoreLocked: ['C-c', 'tab']
  });
  const inputElements = [null];
  let current = 0;
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
  screen.key(['tab'], function(ch, key) {
    current++;
    if (current === inputElements.length) {
      current=0;
    }
    screen.focusPush(inputElements[current]);
    screen.render();
    return false;
  });
  const grid = new contrib.grid(_.merge({rows: 12, cols: 12, screen}, display.gridOptions));
  _.each(display.widgets, (schema, name) => {
    let widget, endTime, displayTime, startTime, refreshTime, refreshCount=0, totalRefreshTime=0, meanRefreshTime, maxRefreshTime, minRefreshTime;
    function update(err, data) {
      endTime = Date.now();
      displayTime = moment();
      refreshTime = endTime - startTime;
      totalRefreshTime += refreshTime;
      minRefreshTime = (_.isUndefined(minRefreshTime) || refreshTime < minRefreshTime) ? refreshTime : minRefreshTime;
      maxRefreshTime = (_.isUndefined(maxRefreshTime) || refreshTime > maxRefreshTime) ? refreshTime : maxRefreshTime;
      meanRefreshTime = totalRefreshTime / refreshCount;
      const widgetData = schema.transformation(data);
      const metadata = {displayTime, startTime, endTime, refreshTime, refreshCount, totalRefreshTime, meanRefreshTime, maxRefreshTime, minRefreshTime};
      const inputFields = getInputFields(gopher.getInput, schema.usesInputKeys);
      widget = widget || widgetHelpers[schema.displayType].builder({screen, grid, schema, data: widgetData, setInput: gopher.setInput, inputFields});
      widgetHelpers[schema.displayType].updater({widget, data: widgetData, metadata, inputFields});
      if (schema.inputKeys) {
        inputElements.push(widget);
        widget.focus();
      }
      screen.render();
    }
    if (schema.source) {
      const jitter = Math.floor(Math.random() * 5000);
      setTimeout(() => {
        setInterval(() => {
          startTime = Date.now();
          ++refreshCount;
          gopher.report(schema.source, update);
        }, schema.refreshInterval || 2000);
        gopher.report(schema.source, update);
      }, jitter);
    } else {
      const inputFields = getInputFields(gopher.getInput, schema.usesInputKeys);
      widget = widgetHelpers[schema.displayType].builder({screen, grid, schema, setInput: gopher.setInput, inputFields});
      if (schema.inputKeys) {
        inputElements.push(widget);
        widget.focus();
      }
    }
  });
}

module.exports = {widgetDashboard};
