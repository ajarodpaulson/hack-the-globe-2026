import dynamo from 'dynamodb-v3';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

let configuredDriver;

const configureDynamo = () => {
  if (configuredDriver) {
    return configuredDriver;
  }

  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'local';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'local';

  const driver = new DynamoDB({
    ...(endpoint ? {endpoint} : {}),
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  dynamo.dynamoDriver(driver);
  configuredDriver = driver;

  return configuredDriver;
};

export {configureDynamo};

export default configureDynamo;
