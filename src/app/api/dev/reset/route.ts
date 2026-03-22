import { DynamoDB } from '@aws-sdk/client-dynamodb';

export function getDynamoClient() {
  return new DynamoDB({
    endpoint: process.env.DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION ?? 'us-west-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
    },
  });
}

export async function resetTable() {
  const client = getDynamoClient();
  const tableName = 'Analyzed_Encounter';

  await client.deleteTable({ TableName: tableName }).catch((e: Error & { name?: string }) => {
    if (e.name !== 'ResourceNotFoundException') throw e;
  });

  await new Promise((r) => setTimeout(r, 800));

  await client.createTable({
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: 'analyzedEncounterRn', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'analyzedEncounterRn', KeyType: 'HASH' }],
    BillingMode: 'PAY_PER_REQUEST',
  });
}

export async function POST() {
  try {
    await resetTable();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
