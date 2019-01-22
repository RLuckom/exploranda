const exploranda = require('../lib/reporter');
const _ = require('lodash');
const moment = require('moment');

exploranda.widgetDashboard({
  dataDependencies: {},
  inputs: {
    library: 'exploranda',
    time: 'RLuckom/exploranda'
  },
  display: {
    widgets: {
      libraryInput: {
        title: 'library',
        displayType: 'textBox',
        inputKeys: 'library',
        position: {
          column: 6,
          row: 0,
          rowSpan: 2,
          columnSpan: 6
        },
      },
      userInput: {
        title: 'time',
        displayType: 'timeBox',
        inputKeys: 'repo',
        position: {
          column: 6,
          row: 2,
          rowSpan: 2,
          columnSpan: 6
        },
      },
      jsonInput: {
        title: 'json',
        displayType: 'jsonArea',
        inputKeys: 'json',
        logErrors: true,
        position: {
          column: 0,
          row: 0,
          rowSpan: 6,
          columnSpan: 6
        },
      },
      messages: {
        title: 'Messages',
        displayType: 'messages',
        position: {
          column: 6,
          row: 4,
          rowSpan: 6,
          columnSpan: 6
        },
      },
    },
  }
});
