2.0.0

2.0.0 includes a breaking change. Until 2.0.0, when using a `source`
for a dependency `param` value, the associated `formatter` function 
would be passed the specified `source` dependencies as sequential
arguments:

```javascript
params: {
  kinesisStreamsStartingWithJ: {
    source: ['kinesisStreamNames', 'secondSource'],
    formatter: (kinesisStreamNames, secondSource) => _.filter(kinesisStreamNames, (n) => _.startsWith(n, 'j'))
  }
}
``` 

This made formatters for params with a large number of sources extremely unweildy.
Starting in 2.0.0, formatters will be passed an object whose keys are the names of the
sources, and whose values are the source values:

```javascript
params: {
  kinesisStreamsStartingWithJ: {
    source: ['kinesisStreamNames', 'secondSource'],
    formatter: (sources) => _.filter(sources['kinesisStreamNames'], (n) => _.startsWith(n, 'j'))
  }
}
``` 

In many cases, you should be able to adapt old code to this pattern simply by enclosing
the formatter's signature in `{}`.

This change does have a downside; it is now necessary to use a `formatter` function with nearly
every parameter that comes from a `source`. If no `formatter` is provided, the parameter value
passed to the executor will be the map that would have ben passed to the `formatter`, rather than
the raw value.
