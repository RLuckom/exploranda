## Testing Exploranda

Exploranda's testing strategy focuses heavily on functional tests. The
functional testing framework takes the approach of mocking only external
dependencies--[`request`](../spec/requestMock.js), and [`aws`](../spec/awsMock.js)
so far--and setting up complete dependency graphs and request scenarios.
The test framework instantiates a `Gopher` object with a test-supplied
dependency graph. It then calls `Gopher.report` in phases defined by
the test. Before each phase, the test framework validates the state
of the cache and sets up expectations for the asynchronous calls to the
external dependencies. Then the test calls `report`. It validates that
the expected asynchronous calls were made (and no extra ones were made),
validates the result, and then validates the state of the cache.

All of the functional test cases are in the [`spec/lib/composer/composer.spec.js`](../spec/lib/composer/composer.spec.js)
file. The functional test runner is in  [`spec/lib/composer.spec.js`](../spec/lib/composer.spec.js).

This is an example test case: 

```javascript
const basicAwsCachingTestCase = {
  name: 'Single-source caching request case',
  dataDependencies: {
    kinesisNames: kinesisNamesDependency(1000)
  },
  phases: [
  {
    time: 0,
    preCache: {},
    mocks: {
      kinesisNames: {
        source: 'AWS',
        sourceConfig: successfulKinesisCall('listStreams', [{Limit: 100}], {StreamNames: ['foo', 'bar', 'baz']})
      }
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
  },
  {
    time: 500,
    mocks: {},
    preCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    postCache: {
      kinesisNames: [{collectorArgs: {apiConfig: apiConfig().value}, r: ['foo', 'bar', 'baz']}]
    },
    expectedValues: {
      kinesisNames: ['foo', 'bar', 'baz']
    }
  }]
};
```

### Test Case Fields

`name`: A descriptive name for the test.

`dataDependencies`: An ordinary dependency graph to test.

`phases`: An array of `phase` objects.

#### `phase` object fields

`time`: the time in milliseconds after the start of the test when the phase
should be triggered by calling the `report` method.

`mocks`: [Object] It's convenient to use the keys to identify the dependency
the mocks are for, but the keys aren't used. The values are mock objects
or arrays of mock objects.

`target`: the argument to be passed to `report`

`expectedValues`: The expected result of calling `report`.

`preCache`: the expected state of the cache before the test starts.

`postCache`: the expected state of the cache after the test ends.

##### `mock` object fields 

`source`: the name of the `dataSource`, as it appears on the relevant
`accessSchema` object. 

`sourceConfig`: A `sourceConfig` object or array of `sourceConfig` objects

###### `aws` `sourceConfig` object fields

`initialization`: The namespace initialization object: 

```javascript
const initialization = {
  namespace: 'kinesis',
  argunents: {
    accessKeyId: "string",
    secretAccessKey: "string",
    sessionToken: "string",
    region: "string",
  }
};
``` 

`callParameters`: the callParameters object:

```javascript
const callParameters = {
  method: 'DescribeStream',
  argunents: {
    StreamName: "string",
  }
};
``` 

`error`: The error to return for the call

`response`: the response to return for the call.

###### `GENERIC_API` `sourceConfig` object fields.

`callParameters`: Object. The expected first argument to `request`, wrapped
in an array.  e.g.

```javascript
callParameters = [{
  url: 'https://www.example.com/secrets/foo/',
  method: 'GET',
  qs: {list: true},
  headers: {
    'X-Vault-Token': 'secretVaultToken'
  },
  body: void(0),
  json: true,
}];
```

`error`: The error to return

`response`: The response to return

`body` : the body to return


