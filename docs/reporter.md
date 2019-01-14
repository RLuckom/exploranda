## Using the Reporter Object

The Reporter object was the first version of the reporter objects built
aroud the Gopher functionality.

To create a full report using the Reporter object, you need to create 
three data structures, pass them to the report executor, and execute the report. The
following example would display network data in and out of an EC2 instance on a pair of line
charts in the console:

```javascript
const _ = require('lodash');
const exploranda = require('./lib/reporter');
const {ec2MetricsBuilder} = exploranda.dataSources.AWS.ec2;
const instanceId = 'i-00e2c685b5bf8667f';
const apiConfig = {region: 'us-east-1'};

const reporter = new exploranda.Reporter();
reporter.setSchemas({
  // The dependencies section enumerates the data this report requires.
  dependencies: {
    // The functions like `ec2MetricsBuilder` are convenience functions that create
    // dependency objects. See the "Dependencies" section for a more complete description.
    instanceNetworkIn: ec2MetricsBuilder(
      // AWS account and region data
      apiConfig,
      // The value to pass as the MetricName parameter is "NetworkPacketsIn"
      {value: 'NetworkPacketsIn'},
      // The value to pass as the Statistics parameter is the array.
      {value: ['Average', 'Maximum']},
      // The value to pass as the Dimensions parameter is the array.
      {value: [{Name: 'InstanceId', Value: instanceId}]}
    ),
    instanceNetworkOut: ec2MetricsBuilder(
      apiConfig,
      {value: 'NetworkPacketsOut'},
      {value: ['Average', 'Maximum']},
      {value: [{Name: 'InstanceId', Value: instanceId}]}
    )
  },
  transformation: {
    [`${instanceId} Network Packets In`]: {
      type: 'CUSTOM',
      source: 'instanceNetworkIn',
      // Specify a function to transform the dependency into the shape needed by the output.
      // In this case, it's a structure that can be graphed.
      tableBuilder: ([ec2MetricPoints]) => {
        const times = _.map(ec2MetricPoints, (point) => point.Timestamp.getMinutes().toString());
        return [{
          title: 'Average',
          style: {line: 'yellow'},
          x: _.cloneDeep(times),
          y: _.map(ec2MetricPoints, 'Average'),
        }, {
          title: 'Maximum',
          style: {line: 'red'},
          x: _.cloneDeep(times),
          y: _.map(ec2MetricPoints, 'Maximum'),
        }];
      }
    },
    [`${instanceId} Network Packets Out`]: {
      type: 'CUSTOM',
      source: 'instanceNetworkOut',
      tableBuilder: ([ec2MetricPoints]) => {
        const times = _.map(ec2MetricPoints, (point) => point.Timestamp.getMinutes().toString());
        return [{
          title: 'Average',
          style: {line: 'yellow'},
          x: _.cloneDeep(times),
          y: _.map(ec2MetricPoints, 'Average'),
        }, {
          title: 'Maximum',
          style: {line: 'red'},
          x: _.cloneDeep(times),
          y: _.map(ec2MetricPoints, 'Maximum'),
        }];
      }
    },
  },
  display: {
    // Each top-level key specifies the visualizations of a particular type
    // to display. This one specifies all the line plots.
    lines: {
      [`${instanceId} Network Packets In`]: {
        // All the display objects have at least these four keys, specifying the
        // size and position of the visualizations in a 12 x 12 grid.
        column: 0,
        row: 0,
        rowSpan: 6,
        columnSpan: 12
      },
      [`${instanceId} Network Packets Out`]: {
        column: 0,
        row: 6,
        rowSpan: 6,
        columnSpan: 12
      },
    }
  }
});

reporter.execute();
```
!["Network IO"](images/net_io.png)

A slightly expanded version of this report, which takes an instance ID as a command-line
parameter, is available in the `examples` directory. You can run it using:

```
node examples/netIO.js <instance id>
```

If the display has 'nonprintable character' blocks or question marks where other characters
should be, you might need to run it with:

```
LANG=en_US.utf8 TERM=xterm-256color node examples/netIO.js
```

If you only want to use this as a quick way to get JSON from APIs, you can use just
the `dependencies` pipeline stage without specifying either of the other stages, and your data
will be passed to a callback you provide. If you wanted, you could specify the first two stages
and get back structured data without using the builtin `display` stage. When a 
`display` isn't specified, the default is to log JSON to stdout, so it should be easy enough to
integrate with tools in other languages. An example of a report that logs all the instances
in an AWS account as a JSON array is at `examples/instancesJson.js`.
