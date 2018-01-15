module.exports = {
  elasticsearch: require('./dataSources/elasticsearch/elasticsearch'),
  AWS: {
    ec2: require('./dataSources/aws/ec2'),
    cloudwatch: require('./dataSources/aws/cloudwatch'),
    cloudwatchlogs: require('./dataSources/aws/cloudwatchlogs'),
    ecs: require('./dataSources/aws/ecs'),
    ebs: require('./dataSources/aws/ebs'),
    iam: require('./dataSources/aws/iam'),
    kinesis: require('./dataSources/aws/kinesis'),
  }
};
