import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  // AWS
  awsRegion: process.env.AWS_REGION || process.env.AWS_REGION_NAME || 'ap-south-1',
  dynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  dynamoDbTablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'parkkaro',

  // Cognito
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',

  // S3
  s3BucketName: process.env.S3_BUCKET_NAME || '',

  // Bedrock
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-south-1',

  // App
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Business
  platformCommissionPercent: parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10'),
  taxPercent: parseFloat(process.env.TAX_PERCENT || '0'),

  // Auth
  authMode: (process.env.AUTH_MODE || 'demo') as 'cognito' | 'demo',

  // Payment
  paymentProvider: (process.env.PAYMENT_PROVIDER || 'MOCK') as 'MOCK' | 'RAZORPAY' | 'STRIPE',
};

/**
 * Returns the DynamoDB table name with prefix.
 * e.g., tableName('parking') => 'parkkaro-parking'
 */
export function tableName(entity: string): string {
  return `${env.dynamoDbTablePrefix}-${entity}`;
}
