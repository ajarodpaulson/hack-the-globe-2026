import { DynamoDB } from '@aws-sdk/client-dynamodb';

const client = new DynamoDB({
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-west-2',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

await client.createTable({
  TableName: 'Analyzed_Encounter',
  AttributeDefinitions: [{ AttributeName: 'analyzedEncounterRn', AttributeType: 'S' }],
  KeySchema: [{ AttributeName: 'analyzedEncounterRn', KeyType: 'HASH' }],
  BillingMode: 'PAY_PER_REQUEST',
});

console.log('Table created.');
