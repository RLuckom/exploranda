const exploranda = require('../lib/reporter');
const {instancesBuilder} = exploranda.dataSources.AWS.ec2;

const awsConfig = {region: 'us-east-1'};

function getReport() {
  const reporter = new exploranda.Reporter();
  reporter.setSchemas({
    dependencies: {instances: instancesBuilder(awsConfig)},
  });
  reporter.execute((e, r) => console.log(JSON.stringify(r.instances, null, 2)));
}

getReport();
