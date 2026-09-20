#!/usr/bin/env node
/**
 * ParkKaro — S3 Presigned URL Generator
 *
 * Generates presigned URLs for secure image upload/download.
 * Used by the backend to authorize image uploads without
 * exposing AWS credentials to the frontend.
 *
 * Usage:
 *   npx ts-node scripts/s3-presign.ts upload --key "listings/abc123/photo1.jpg"
 *   npx ts-node scripts/s3-presign.ts download --key "listings/abc123/photo1.jpg"
 *
 * Environment:
 *   S3_BUCKET_NAME  (required) — from CloudFormation output
 *   AWS_REGION      (optional) — defaults to ap-south-1
 *
 * Owner: Person 3 (AWS Infrastructure)
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.S3_BUCKET_NAME;

if (!BUCKET) {
  console.error('❌ S3_BUCKET_NAME environment variable is required.');
  process.exit(1);
}

const s3Client = new S3Client({ region: REGION });

/**
 * Generate a presigned PUT URL for uploading an image.
 *
 * Object key format: listings/{listingId}/{filename}
 * Expiry: 15 minutes
 * Max size: 10MB
 */
async function generateUploadUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: 'image/*',
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  return url;
}

/**
 * Generate a presigned GET URL for downloading/viewing an image.
 *
 * Expiry: 1 hour
 */
async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return url;
}

// ─── CLI ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  const action = process.argv[2];
  const keyIdx = process.argv.indexOf('--key');
  const key = keyIdx !== -1 ? process.argv[keyIdx + 1] : undefined;

  if (!key) {
    console.log(`
ParkKaro S3 Presigned URL Generator

Usage:
  npx ts-node scripts/s3-presign.ts upload --key "listings/abc123/photo1.jpg"
  npx ts-node scripts/s3-presign.ts download --key "listings/abc123/photo1.jpg"

Key format:
  listings/{listingId}/{filename}    — Parking listing photos
  profiles/{userId}/{filename}       — Profile images
  disputes/{disputeId}/{filename}    — Dispute evidence

Environment:
  S3_BUCKET_NAME  (required)
  AWS_REGION      (defaults to ap-south-1)
    `);
    return;
  }

  switch (action) {
    case 'upload': {
      const url = await generateUploadUrl(key);
      console.log(`\n📤 Upload URL (expires in 15 min):\n${url}\n`);
      console.log(`Usage: curl -X PUT -T <file> "${url}"\n`);
      break;
    }
    case 'download': {
      const url = await generateDownloadUrl(key);
      console.log(`\n📥 Download URL (expires in 1 hour):\n${url}\n`);
      break;
    }
    default:
      console.error(`❌ Unknown action: ${action}. Use 'upload' or 'download'.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
