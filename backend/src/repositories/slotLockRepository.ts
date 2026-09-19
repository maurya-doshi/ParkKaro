import { BaseRepository } from './baseRepository';
import { SlotLock } from '../models/SlotLock';
import { docClient } from '../config/database';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

export class SlotLockRepository extends BaseRepository<SlotLock> {
  constructor() {
    super('slot-locks');
  }

  /**
   * Check if any of the requested slots are already locked.
   */
  async checkSlotsAvailable(listingId: string, slotKeys: string[]): Promise<boolean> {
    for (const slotKey of slotKeys) {
      const lock = await this.getItem({ listingId, slotKey });
      if (lock && lock.status === 'BOOKED') {
        return false;
      }
    }
    return true;
  }

  /**
   * Atomically acquire all slots for a booking using TransactWriteItems.
   * If any slot is already booked, DynamoDB throws TransactionCanceledException,
   * guaranteeing no double-booking occurs even under concurrent requests.
   */
  async acquireLocks(locks: SlotLock[]): Promise<boolean> {
    if (locks.length === 0) return true;

    const transactItems = locks.map((lock) => ({
      Put: {
        TableName: this.tableName,
        Item: lock,
        ConditionExpression: 'attribute_not_exists(slotKey) OR #status = :released',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':released': 'RELEASED',
        },
      },
    }));

    try {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: transactItems,
        })
      );
      return true;
    } catch (err: any) {
      if (
        err.name === 'TransactionCanceledException' ||
        err.name === 'ConditionalCheckFailedException'
      ) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Release all slots held by a booking when it is cancelled.
   */
  async releaseLocks(listingId: string, slotKeys: string[]): Promise<void> {
    for (const slotKey of slotKeys) {
      try {
        await this.updateItem(
          { listingId, slotKey },
          'SET #status = :status',
          { '#status': 'status' },
          { ':status': 'RELEASED' }
        );
      } catch (err) {
        // Continue releasing remaining slots
      }
    }
  }

  /**
   * Query all locks for a listing on a specific date.
   */
  async getLocksForListingAndDate(listingId: string, date: string): Promise<SlotLock[]> {
    return this.queryItems({
      KeyConditionExpression: 'listingId = :listingId AND begins_with(slotKey, :datePrefix)',
      ExpressionAttributeValues: {
        ':listingId': listingId,
        ':datePrefix': `${date}#`,
      },
    });
  }
}

export const slotLockRepository = new SlotLockRepository();
