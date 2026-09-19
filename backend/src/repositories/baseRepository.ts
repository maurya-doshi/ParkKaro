import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  BatchWriteCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  TransactWriteCommandInput,
  BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/database';
import { tableName } from '../config/env';

/**
 * Base repository providing shared DynamoDB Document Client utilities.
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  protected tableName: string;

  constructor(entityName: string) {
    this.tableName = tableName(entityName);
  }

  /**
   * Get an item by its primary key (PK and optional SK).
   */
  async getItem(key: Record<string, any>): Promise<T | null> {
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: key,
    };
    const response = await docClient.send(new GetCommand(params));
    return (response.Item as T) || null;
  }

  /**
   * Put an item into the table.
   */
  async putItem(item: T, conditionExpression?: string, expressionAttributeNames?: Record<string, string>, expressionAttributeValues?: Record<string, any>): Promise<T> {
    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };
    await docClient.send(new PutCommand(params));
    return item;
  }

  /**
   * Update an item using an UpdateExpression.
   */
  async updateItem(
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeNames?: Record<string, string>,
    expressionAttributeValues?: Record<string, any>
  ): Promise<T | null> {
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    const response = await docClient.send(new UpdateCommand(params));
    return (response.Attributes as T) || null;
  }

  /**
   * Delete an item by its primary key.
   */
  async deleteItem(key: Record<string, any>, conditionExpression?: string): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: key,
      ConditionExpression: conditionExpression,
    };
    await docClient.send(new DeleteCommand(params));
  }

  /**
   * Query the table or a GSI.
   */
  async queryItems(params: Omit<QueryCommandInput, 'TableName'>): Promise<T[]> {
    const queryParams: QueryCommandInput = {
      TableName: this.tableName,
      ...params,
    };
    const response = await docClient.send(new QueryCommand(queryParams));
    return (response.Items as T[]) || [];
  }

  /**
   * Scan items from the table (used sparingly for admin/search fallback).
   */
  async scanItems(params?: Omit<ScanCommandInput, 'TableName'>): Promise<T[]> {
    const scanParams: ScanCommandInput = {
      TableName: this.tableName,
      ...(params || {}),
    };
    const response = await docClient.send(new ScanCommand(scanParams));
    return (response.Items as T[]) || [];
  }

  /**
   * Execute a batch write operation.
   */
  async batchWrite(putItems?: T[], deleteKeys?: Record<string, any>[]): Promise<void> {
    const requests: any[] = [];
    if (putItems) {
      requests.push(...putItems.map((item) => ({ PutRequest: { Item: item } })));
    }
    if (deleteKeys) {
      requests.push(...deleteKeys.map((key) => ({ DeleteRequest: { Key: key } })));
    }

    if (requests.length === 0) return;

    // DynamoDB BatchWriteItem supports max 25 items per call
    const chunks: any[][] = [];
    for (let i = 0; i < requests.length; i += 25) {
      chunks.push(requests.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const params: BatchWriteCommandInput = {
        RequestItems: {
          [this.tableName]: chunk,
        },
      };
      await docClient.send(new BatchWriteCommand(params));
    }
  }

  /**
   * Execute transactional write items across tables or within this table.
   */
  static async transactWrite(items: TransactWriteCommandInput['TransactItems']): Promise<void> {
    const params: TransactWriteCommandInput = {
      TransactItems: items,
    };
    await docClient.send(new TransactWriteCommand(params));
  }
}
