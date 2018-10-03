module.exports = {
  elasticsearch: require('./dataSources/elasticsearch/elasticsearch'),
  request: require('./dataSources/request/request'),
  AWS: {
    ec2: require('./dataSources/aws/ec2'),
    cloudwatch: require('./dataSources/aws/cloudwatch'),
    cloudwatchlogs: require('./dataSources/aws/cloudwatchlogs'),
    ecs: require('./dataSources/aws/ecs'),
    ebs: require('./dataSources/aws/ebs'),
    iam: require('./dataSources/aws/iam'),
    s3: require('./dataSources/aws/s3'),
    kinesis: require('./dataSources/aws/kinesis'),
  },
  google: {
    compute: require('./dataSources/google/compute'),
    stackdriverMonitoring: require('./dataSources/google/stackdriverMonitoring'),
    stackdriverLogging: require('./dataSources/google/stackdriverLogging'),
  }
};
