import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { nanoid } from 'nanoid';
import { generateRandomClusterRecords, generateSeedRecords } from '@/lib/seed-generator';
import { resetTable } from '../reset/route';

const MAX_COUNT = 100000;
const BATCH_SIZE = 25;       // DynamoDB BatchWriteItem hard limit — cannot exceed 25
const PARALLEL_BATCHES = 40; // concurrent requests; fine for DynamoDB Local

function getDynamoClient() {
  return new DynamoDB({
    endpoint: process.env.DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION ?? 'us-west-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { count = 100, mode = 'random' } = await request.json().catch(() => ({}));
    const requested = Number(count) || 100;
    const n = Math.min(Math.max(1, requested), MAX_COUNT);
    const capped = n < requested;

    const records = mode === 'weighted'
      ? generateSeedRecords(n)
      : generateRandomClusterRecords(n);

    await resetTable();

    const client = getDynamoClient();
    const tableName = 'Analyzed_Encounter';

    // Split into batches of 25, then fire PARALLEL_BATCHES at a time
    const batches: (typeof records)[] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE));
    }

    const sendBatch = (chunk: typeof records) =>
      client.batchWriteItem({
        RequestItems: {
          [tableName]: chunk.map((record) => ({
            PutRequest: {
              Item: marshall(
                { analyzedEncounterRn: `RN:ANALYZEDENCOUNTER-V1-${nanoid()}`, ...record },
                { removeUndefinedValues: true },
              ),
            },
          })),
        },
      });

    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      await Promise.all(batches.slice(i, i + PARALLEL_BATCHES).map(sendBatch));
    }

    return Response.json({ ok: true, inserted: n, capped, max: MAX_COUNT });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
