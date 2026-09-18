import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env';

const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: env.awsRegion,
};

// For local development with DynamoDB Local
if (env.dynamoDbEndpoint) {
  clientConfig.endpoint = env.dynamoDbEndpoint;
  clientConfig.credentials = {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  };
}

const ddbClient = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export { ddbClient };
