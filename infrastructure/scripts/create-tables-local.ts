#!/usr/bin/env node
/**
 * ParkShare — DynamoDB Table Setup Script
 *
 * Creates all 14 DynamoDB tables with correct key schemas and GSIs
 * for local development using DynamoDB Local.
 *
 * For production, tables are created by the SAM/CloudFormation template.
 * This script is ONLY for local development with DynamoDB Local.
 *
 * Usage:
 *   npx ts-node scripts/create-tables-local.ts
 *
 * Prerequisites:
 *   - DynamoDB Local running on http://localhost:8000
 *     docker run -p 8000:8000 amazon/dynamodb-local
 *
 * Owner: Person 3 (AWS Infrastructure)
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  type CreateTableCommandInput,
  type GlobalSecondaryIndex,
  type KeySchemaElement,
  type AttributeDefinition,
} from '@aws-sdk/client-dynamodb';

const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'parkshare';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

// ─── Table Definitions ───────────────────────────────────────
// Matches docs/DATABASE_SCHEMA.md exactly

interface TableDef {
  name: string;
  keySchema: KeySchemaElement[];
  attributeDefinitions: AttributeDefinition[];
  gsis?: GlobalSecondaryIndex[];
}

const tables: TableDef[] = [
  // 1. Users
  {
    name: `${PREFIX}-users`,
    keySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'role', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'role-index',
        KeySchema: [
          { AttributeName: 'role', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 2. ParkingListings
  {
    name: `${PREFIX}-parking`,
    keySchema: [{ AttributeName: 'listingId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'listingId', AttributeType: 'S' },
      { AttributeName: 'hostId', AttributeType: 'S' },
      { AttributeName: 'area', AttributeType: 'S' },
      { AttributeName: 'city', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'pricePerHour', AttributeType: 'N' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'hostId-index',
        KeySchema: [
          { AttributeName: 'hostId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'area-price-index',
        KeySchema: [
          { AttributeName: 'area', KeyType: 'HASH' },
          { AttributeName: 'pricePerHour', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'city-index',
        KeySchema: [
          { AttributeName: 'city', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 3. Bookings
  {
    name: `${PREFIX}-bookings`,
    keySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'bookingId', AttributeType: 'S' },
      { AttributeName: 'driverId', AttributeType: 'S' },
      { AttributeName: 'hostId', AttributeType: 'S' },
      { AttributeName: 'listingId', AttributeType: 'S' },
      { AttributeName: 'bookingStatus', AttributeType: 'S' },
      { AttributeName: 'startTime', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'driverId-index',
        KeySchema: [
          { AttributeName: 'driverId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'hostId-index',
        KeySchema: [
          { AttributeName: 'hostId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'listingId-index',
        KeySchema: [
          { AttributeName: 'listingId', KeyType: 'HASH' },
          { AttributeName: 'startTime', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'bookingStatus', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 4. SlotLocks
  {
    name: `${PREFIX}-slot-locks`,
    keySchema: [
      { AttributeName: 'listingId', KeyType: 'HASH' },
      { AttributeName: 'slotKey', KeyType: 'RANGE' },
    ],
    attributeDefinitions: [
      { AttributeName: 'listingId', AttributeType: 'S' },
      { AttributeName: 'slotKey', AttributeType: 'S' },
    ],
  },

  // 5. Vehicles
  {
    name: `${PREFIX}-vehicles`,
    keySchema: [{ AttributeName: 'vehicleId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'vehicleId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 6. Reviews
  {
    name: `${PREFIX}-reviews`,
    keySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'reviewId', AttributeType: 'S' },
      { AttributeName: 'listingId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'bookingId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'listingId-index',
        KeySchema: [
          { AttributeName: 'listingId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'bookingId-index',
        KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 7. Favorites
  {
    name: `${PREFIX}-favorites`,
    keySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'listingId', KeyType: 'RANGE' },
    ],
    attributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'listingId', AttributeType: 'S' },
    ],
  },

  // 8. Payments
  {
    name: `${PREFIX}-payments`,
    keySchema: [{ AttributeName: 'paymentId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'paymentId', AttributeType: 'S' },
      { AttributeName: 'bookingId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'bookingId-index',
        KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 9. Payouts
  {
    name: `${PREFIX}-payouts`,
    keySchema: [{ AttributeName: 'payoutId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'payoutId', AttributeType: 'S' },
      { AttributeName: 'hostId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'hostId-index',
        KeySchema: [
          { AttributeName: 'hostId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 10. Notifications
  {
    name: `${PREFIX}-notifications`,
    keySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'notificationId', KeyType: 'RANGE' },
    ],
    attributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'notificationId', AttributeType: 'S' },
    ],
  },

  // 11. Conversations
  {
    name: `${PREFIX}-conversations`,
    keySchema: [{ AttributeName: 'conversationId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'conversationId', AttributeType: 'S' },
      { AttributeName: 'participant1', AttributeType: 'S' },
      { AttributeName: 'participant2', AttributeType: 'S' },
      { AttributeName: 'lastMessageAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'participant1-index',
        KeySchema: [
          { AttributeName: 'participant1', KeyType: 'HASH' },
          { AttributeName: 'lastMessageAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'participant2-index',
        KeySchema: [
          { AttributeName: 'participant2', KeyType: 'HASH' },
          { AttributeName: 'lastMessageAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 12. Messages
  {
    name: `${PREFIX}-messages`,
    keySchema: [
      { AttributeName: 'conversationId', KeyType: 'HASH' },
      { AttributeName: 'messageId', KeyType: 'RANGE' },
    ],
    attributeDefinitions: [
      { AttributeName: 'conversationId', AttributeType: 'S' },
      { AttributeName: 'messageId', AttributeType: 'S' },
    ],
  },

  // 13. Disputes
  {
    name: `${PREFIX}-disputes`,
    keySchema: [{ AttributeName: 'disputeId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'disputeId', AttributeType: 'S' },
      { AttributeName: 'bookingId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'reportedBy', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'bookingId-index',
        KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'reportedBy-index',
        KeySchema: [
          { AttributeName: 'reportedBy', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },

  // 14. Reports
  {
    name: `${PREFIX}-reports`,
    keySchema: [{ AttributeName: 'reportId', KeyType: 'HASH' }],
    attributeDefinitions: [
      { AttributeName: 'reportId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'reportedBy', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    gsis: [
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'reportedBy-index',
        KeySchema: [
          { AttributeName: 'reportedBy', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },
];

// ─── Create Tables ───────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🗄️  ParkShare — Creating DynamoDB tables (local)`);
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Prefix:   ${PREFIX}\n`);

  // List existing tables
  const existing = await client.send(new ListTablesCommand({}));
  const existingNames = new Set(existing.TableNames || []);

  let created = 0;
  let skipped = 0;

  for (const table of tables) {
    if (existingNames.has(table.name)) {
      console.log(`   ⏭️  ${table.name} (already exists)`);
      skipped++;
      continue;
    }

    const params: CreateTableCommandInput = {
      TableName: table.name,
      KeySchema: table.keySchema,
      AttributeDefinitions: table.attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST',
    };

    if (table.gsis && table.gsis.length > 0) {
      params.GlobalSecondaryIndexes = table.gsis;
    }

    await client.send(new CreateTableCommand(params));
    console.log(`   ✅ ${table.name}`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped (already exist)`);
  console.log(`   Total tables: ${tables.length}\n`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
