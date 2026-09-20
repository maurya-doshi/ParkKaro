import { BaseRepository } from './baseRepository';
import { Payout, PayoutStatus } from '../models/Payout';

export class PayoutRepository extends BaseRepository<Payout> {
  constructor() {
    super('payouts');
  }

  async create(payout: Payout): Promise<Payout> {
    return this.putItem(payout);
  }

  async findById(payoutId: string): Promise<Payout | null> {
    return this.getItem({ payoutId });
  }

  async findByHostId(hostId: string): Promise<Payout[]> {
    return this.queryItems({
      IndexName: 'hostId-index',
      KeyConditionExpression: 'hostId = :hostId',
      ExpressionAttributeValues: {
        ':hostId': hostId,
      },
    });
  }

  async updateStatus(payoutId: string, status: PayoutStatus): Promise<Payout | null> {
    return this.updateItem(
      { payoutId },
      'SET #status = :status, #updatedAt = :updatedAt',
      {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      }
    );
  }

  async listAll(limit = 100): Promise<Payout[]> {
    return this.scanItems({ Limit: limit });
  }
}

export const payoutRepository = new PayoutRepository();
