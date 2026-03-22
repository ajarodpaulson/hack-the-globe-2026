import { DynamoDB } from '@aws-sdk/client-dynamodb';

const client = new DynamoDB({
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-west-2',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

console.log('Deleting table...');
await client.deleteTable({ TableName: 'Analyzed_Encounter' }).catch((e) => {
  if (e.name === 'ResourceNotFoundException') console.log('Table did not exist.');
  else throw e;
});

// Wait for deletion
await new Promise((r) => setTimeout(r, 1000));

console.log('Recreating table...');
await client.createTable({
  TableName: 'Analyzed_Encounter',
  AttributeDefinitions: [{ AttributeName: 'analyzedEncounterRn', AttributeType: 'S' }],
  KeySchema: [{ AttributeName: 'analyzedEncounterRn', KeyType: 'HASH' }],
  BillingMode: 'PAY_PER_REQUEST',
});

console.log('Done. Run npm run seed:analysis to populate.');
