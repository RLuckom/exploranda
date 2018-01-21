const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');

function throwClearError(schema, name, sourceData, err) {
  throw new Error(`Problem rendering "${name}" with schema ${JSON.stringify(schema)} and data ${JSON.stringify(sourceData)}:\n${err.stack}`);
}

function dashboard(widgetSchema, fetchTables) {
  const screen = blessed.screen();
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
  const grid = new contrib.grid({rows: 12, cols: 12, screen});
  const widgets = {
    tables: {},
    markdowns: {},
    donuts: {},
    bars: {},
    stackedBars: {},
    lines: {}
  };
  fetchTables((e, r) => {
    if (e) {console.log(e); process.exit(1);}
    setInterval(() => {
      fetchTables(display)
    }, 6000);
    display(e, r);
  });
  function display(e, tables) {
    if (e) {
      console.log(e);
      return process.exit(0);
    }
    _.each(widgetSchema.tables, (tableSchema, tableName) => {
      const tableData = tables[tableName].table;
      try {
        const columnWidth = _(tableData)
        // rotate
          .unzip()
        // convert the elements of the columns to their length, adding 2 for spacing
          .map((row) => _(row).map((el) => (_.isUndefined(el) ? '' : el).toString().length + 2).value())
        // take the length of the longest elemeni in each row. This is the width of the row.
          .map(_.max)
          .value();
        const table = widgets.tables[tableName] || grid.set(
          tableSchema.row,
          tableSchema.column,
          tableSchema.rowSpan,
          tableSchema.columnSpan,
          contrib.table,
          {
            label: tableName,
            fg: tableSchema.fg || 'white',
            selectedBg: tableSchema.selectedBg || 'black',
            columnSpacing: 1,
            columnWidth
          }
        );
        screen.on('resize', () => table.emit('attach'));
        table.setData({headers: tableData[0], data: tableData.slice(1)});
        widgets.tables[tableName] = table;
      } catch(err) {
        throwClearError(tableSchema, tableName, tableData, err);
      }
    });
    _.each(widgetSchema.markdowns, (markdownSchema, markdownName) => {
      const markdownData = tables[markdownName].table;
      try {
        const markdown = widgets.markdowns[markdownName] || grid.set(
          markdownSchema.row,
          markdownSchema.column,
          markdownSchema.rowSpan,
          markdownSchema.columnSpan,
          contrib.markdown,
          {label: markdownName}
        );
        screen.on('resize', () => markdown.emit('attach'));
        markdown.setMarkdown(markdownData.slice(1).join('\n'));
        widgets.markdowns[markdownName] = markdown;
      } catch(err) {
        throwClearError(markdownSchema, markdownName, markdownData, err);
      }
    });
    _.each(widgetSchema.donuts, (donutSchema, donutName) => {
      const donutData = tables[donutName].table;
      try {
        const donut = widgets.donuts[donutName] || grid.set(
          donutSchema.row,
          donutSchema.column,
          donutSchema.rowSpan,
          donutSchema.columnSpan,
          contrib.donut,
          {
            label: donutName,
            radius: donutSchema.radius || 10,
            arcWidth: donutSchema.arcWidth || 4,
          }
        );
        donut.setData(donutData);
        screen.on('resize', () => donut.emit('attach'));
        widgets.donuts[donutName] = donut;
      } catch(err) {
        throwClearError(donutSchema, donutName, donutData, err);
      }
    });
    _.each(widgetSchema.lines, (lineSchema, lineName) => {
      let lineData;
      try {
        lineData = tables[lineName].table;
        const line = widgets.lines[lineName] || grid.set(
          lineSchema.row,
          lineSchema.column,
          lineSchema.rowSpan,
          lineSchema.columnSpan,
          contrib.line,
          {
            label: lineName,
            style: {
              line: lineSchema.lineColor || 'cyan',
              text: lineSchema.textColor || 'green',
              baseline: lineSchema.baselineColor || 'white'
            },
            legend: {width: 16},
            maxY: lineSchema.maxY,
            minY: lineSchema.minY,
            xLabelPadding: lineSchema.xLabelPadding || 3,
            xPadding: lineSchema.xPadding || 0,
            showLegend: _.isUndefined(lineSchema.showLegend) ? true : lineSchema.showLegend,
            wholeNumbersOnly: lineSchema.wholeNumbersOnly
          }
        );
        _.each(lineData, (ld) => ld.title = ld.title || '');
        line.setData(lineData);
        screen.on('resize', () => line.emit('attach'));
        widgets.lines[lineName] = line;
      } catch(err) {
        throwClearError(lineSchema, lineName, lineData, err);
      }
    });
    _.each(widgetSchema.bars, (barSchema, barName) => {
      const barData = tables[barName].table;
      try {
        const bar = widgets.bars[barName] || grid.set(
          barSchema.row,
          barSchema.column,
          barSchema.rowSpan,
          barSchema.columnSpan,
          contrib.bar,
          {
            label: barName,
            barWidth: barSchema.barWidth || 2,
            barSpacing: barSchema.barSpacing || 2,
            xOffset: barSchema.xOffset || 2,
            maxHeight: barSchema.maxHeight || _.max(barData.data)
          }
        );
        bar.setData(barData);
        screen.on('resize', () => bar.emit('attach'));
        widgets.bars[barName] = bar;
      } catch(err) {
        throwClearError(barSchema, barName, barData, err);
      }
    });
    _.each(widgetSchema.stackedBars, (barSchema, barName) => {
      const barData = tables[barName].table;
      try {
        const bar = widgets.stackedBars[barName] || grid.set(
          barSchema.row,
          barSchema.column,
          barSchema.rowSpan,
          barSchema.columnSpan,
          contrib.stackedBar,
          {
            label: barName,
            barWidth: barSchema.barWidth || 2,
            barSpacing: barSchema.barSpacing || 2,
            xOffset: barSchema.xOffset || 2,
            barBgColor: barData.barBgColor,
            maxHeight: barSchema.maxHeight || _.max(barData.data)
          }
        );
        bar.setData(barData);
        screen.on('resize', () => bar.emit('attach'));
        widgets.stackedBars[barName] = bar;
      } catch(err) {
        throwClearError(barSchema, barName, barData, err);
      }
    });
    screen.render();
  }
}

module.exports = {
  dashboard
};
