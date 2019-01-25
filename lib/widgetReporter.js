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
            baseline: _.get(schema, 'displayOptions.baselineColor') || 'white',
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'green',
                type: 'line',
              },
            },
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
  timeBox: {
    builder: ({screen, grid, schema, setInput, getInput}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.box,
        {
          label: schema.title,
          input: true,
          tags: true,
          keys: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      const time = new moment();
      let fields = [
        'year', 'month', 'date', 'hour', 'minute', 'second'
      ];
      let separators = [
        '/', '/', ' ', ':', ':', ''
      ];
      let current = -1;
      let previous = 0;
      let startHighlight = '{blue-bg}{bold}';
      let endHighlight = '{/bold}{/blue-bg}';
      function display(highlight) {
        return _.reduce(fields, (acc, v, i) => {
          const n = v === 'month' ? (time[v]() + 1).toString() : time[v]().toString();
          const hl = (i === current) && highlight
          return acc + (hl ? startHighlight : '') + _.padStart(n, 2, '0') + (hl ? endHighlight : '')  + separators[i];
        }, '');
      }
      function render() {
        widget.setContent(display(true));
        screen.render();
      }
      function submit() {
        setInput(schema.inputKeys, display());
      }
      widget.key(['up'], () => {
        time[fields[current]](time[fields[current]]() + 1);
        render();
      });
      widget.key(['down'], () => {
        time[fields[current]](time[fields[current]]() - 1);
        render();
      });
      widget.key(['left'], () => {
        current = current === 0 ? 5 : current -1;
        render();
      });
      widget.key(['right'], () => {
        current = current === 5 ? 0 : current +1;
        render();
      });
      widget.on('blur', () => {
        previous = current;
        current = -1;
        render();
      });
      widget.on('focus', () => {
        current = previous;
        render();
      });
      widget.key('enter', submit);
      render();
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
  list: {
    builder: ({screen, grid, schema, setInput, getInput, send}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.list,
        {
          label: schema.title,
          input: true,
          keys: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
            selected: {
              bold: true,
            },
          },
        }
      );
      widget.setItems([]);
      screen.render();
      widget.on('select', (e, idx) => {
        send(`submitted ${widget.getItem(idx).content}`);
        setInput(schema.inputKeys, widget.getItem(idx).content);
      });
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    },
    updater: ({widget, data, metadata,inputFields}) => {
      updateMetadata(widget, metadata, inputFields);
      widget.setItems(data);
    }
  },
  textBox: {
    builder: ({screen, grid, schema, setInput, getInput}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.Textbox,
        {
          label: schema.title,
          input: true,
          keys: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      widget.setValue(getInput(schema.inputKeys || ''));
      screen.render();
      widget.on('submit', () => {
        setInput(schema.inputKeys, widget.getValue());
      });
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
  tree: {
    builder: ({screen, grid, schema, setInput, getInput}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        contrib.tree,
        {
          label: schema.title,
          input: true,
          keys: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      widget.setValue(getInput(schema.inputKeys || ''));
      screen.render();
      widget.on('submit', () => {
        setInput(schema.inputKeys, widget.getValue());
      });
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
  textArea: {
    builder: ({screen, grid, schema, setInput, getInput, send}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.Textarea,
        {
          label: schema.title,
          input: true,
          keys: true,
          scrollable: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      widget.setValue(getInput(schema.inputKeys || ''));
      screen.render();
      widget.on('blur', () => {
        setInput(schema.inputKeys, widget.getValue());
        send(`set input ${widget.getValue()}`);
      });
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
  jsonArea: {
    builder: ({screen, grid, schema, setInput, getInput, send}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.Textarea,
        {
          label: schema.title,
          input: true,
          keys: true,
          keyable: true,
          scrollable: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      widget.setValue(getInput(schema.inputKeys || ''));
      screen.render();
      widget.key(['up'], (f, s) => {
        send(screen.program.x);
        send(screen.program.y);
        send(widget.position);
        send({
          height: widget.height,
          width: widget.width,
          aleft: widget.aleft,
          atop: widget.atop,
          abottom: widget.abottom,
          aright: widget.aright,
          left: widget.left,
          right: widget.right,
          top: widget.top,
          bottom: widget.bottom,
          lpos: widget.lpos,
        });
        screen.program.hvp(0, 0);
      });
      widget.on('blur', () => {
        try {
          json = JSON.parse(widget.getValue());
          send("Set valid input JSON");
          setInput(schema.inputKeys, widget.getValue());
        } catch(err) {
          if (schema.logErrors) {
            send(`Could not parse JSON: ${err}`)
          }
        }
      });
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
  messages: {
    builder: ({screen, grid, schema, setInput, getInput, subscribe}) => {
      const widget = grid.set(
        schema.position.row,
        schema.position.column,
        schema.position.rowSpan,
        schema.position.columnSpan,
        blessed.log,
        {
          label: schema.title,
          input: true,
          tags: true,
          scrollable: true,
          alwaysScroll: true,
          style: {
            border: {
              fg: 'cyan',
              type: 'line',
            },
            focus: {
              border: {
                fg: 'cyan',
                type: 'line',
                bold: true,
              },
            },
          },
        }
      );
      const lines = [];
      function addMessage(message) {
        let s = message.message;
        if (!_.isString(s)) {
          try {
            s = JSON.stringify(s);
          } catch(e) {
            s = `${s}`;
          }
        }
        lines.push(`${message.time.format('hh:mm:ss')} {green-fg}${message.sender}{/green-fg} ${s}`)
        widget.setContent(lines.join('\n'));
        screen.render();
      }
      widget.key(['up'], () => widget.scroll(-1));
      widget.key(['down'], () => widget.scroll(1));
      subscribe(addMessage);
      screen.render();
      setWidgetProperties(widget, schema);
      screen.on('resize', () => widget.emit('attach'));
      return widget;
    }
  },
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

function makeScreen(inputElements) {
  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    ignoreLocked: ['C-c', 'tab']
  });
  let current = 0;
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
  screen.key(['tab'], function(ch, key) {
    inputElements[current].set('border', {type: "line", fg: "cyan"});
    current++;
    if (current === inputElements.length) {
      current=0;
    }
    inputElements[current].focus();
    inputElements[current].set('border', {type: "line", fg: "green"});
    if (_.isFunction(inputElements[current].readInput)) {
      inputElements[current].readInput();
    }
    screen.render();
    return false;
  });
  return screen;
}

function buildWidget({screen, inputElements, grid, gopher, schema, name, client})  {
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
    widget = widget || widgetHelpers[schema.displayType].builder(_.merge(client, {screen, grid, schema, data: widgetData, setInput: gopher.setInput, getInput: gopher.getInput, inputFields}));
    widgetHelpers[schema.displayType].updater({widget, data: widgetData, metadata, inputFields});
    inputElements.push(widget);
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
    widget = widgetHelpers[schema.displayType].builder(_.merge(client, {screen, grid, schema, setInput: gopher.setInput, getInput: gopher.getInput, inputFields}));
  }
  return widget;
}

function messagePasser() {
  const messages = [];
  const subscribers = {};
  let subscribedToAll = [];

  function removeSubscriber(f) {
    subscribedToAll = _.filter(subscribedToAll, (s) => s !== f)
    _.each(subscribers, (v, k) => {
      subscribers[k] = _.filter(v, (s) => s !== f)
    });
  }

  function sendSubscriberMessage(message, subscriber) {
    try {
      subscriber(cloneMessage(message));
    } catch(e) {
      removeSubscriber(subscriber);
      addMessage('exploranda', `Subscriber returned error ${e}\nStack:\n${e.stack}`);
    }
  }
  function cloneMessage(message) {
    return {
      time: moment(message.time),
      sender: message.sender,
      message: _.cloneDeep(message.message),
    };
  }
  function addMessage(sender, message) {
    message = {
      time: moment(),
      sender,
      message
    };
    messages.push(message);
    _.each(subscribedToAll, _.partial(sendSubscriberMessage, message));
    _.each(subscribers[sender],  _.partial(sendSubscriberMessage, message));
  }
  function addSubscriber(subscriber, subscriptions) {
    if (_.isString(subscriptions) || _.isNumber(subscriptions)) {
      subscribers[subscriptions] = subscribers[subscriptions] || [];
      subscribers[subscriptions].push(subscriber);
    } else if (_.isArray(subscriptions)) {
      _.each(subscriptions, _.partial(addSubscriber, subscriber));
    } else if (subscriptions) {
      throw new Error(`invalid subscription type: ${subscriptions}`);
    } else {
      removeSubscriber(subscriber);
      subscribedToAll.push(subscriber);
    }
    return _.partial(removeSubscriber, subscriber);
  }

  function getMessages() {
    return _.map(messages, cloneMessage);
  }

  function client(name) {
    if (!_.isString(name) && !_.isNumber(name)) {
      throw new Error(`invalid name ${name}`)
    }
    return {
      send: _.partial(addMessage, name),
      subscribe: addSubscriber,
      getMessages
    };
  }
  return {client};
}

function widgetDashboard({dataDependencies, inputs, display}) {
  const passer = messagePasser(); 
  const gopher = new Gopher(dataDependencies, inputs);
  const widgets = [];
  const screen = makeScreen(widgets);
  const grid = new contrib.grid(_.merge({rows: 12, cols: 12, screen}, _.get(display, 'gridOptions')));
  _.each(_.get(display, 'widgets'), (schema, name) => {
    const w = buildWidget({
      screen, grid, inputElements: widgets, gopher, schema, name, client: passer.client(schema.title)
    });
    if (w) {
      widgets.push(w);
    }
  });
}

module.exports = {widgetDashboard};
