import { BaseRepository } from './baseRepository';
import { Payment, PaymentProviderStatus } from '../models/Payment';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  async create(payment: Payment): Promise<Payment> {
    return this.putItem(payment);
  }

  async findById(paymentId: string): Promise<Payment | null> {
    return this.getItem({ paymentId });
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    const items = await this.queryItems({
      IndexName: 'bookingId-index',
      KeyConditionExpression: 'bookingId = :bookingId',
      ExpressionAttributeValues: {
        ':bookingId': bookingId,
      },
    });
    return items[0] || null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.queryItems({
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  }

  async updateStatus(
    paymentId: string,
    status: PaymentProviderStatus,
    providerRef?: string
  ): Promise<Payment | null> {
    const updateExpressions: string[] = [
      '#status = :status',
      '#updatedAt = :updatedAt',
    ];
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    if (providerRef) {
      updateExpressions.push('#providerRef = :providerRef');
      expressionAttributeNames['#providerRef'] = 'providerRef';
      expressionAttributeValues[':providerRef'] = providerRef;
    }

    return this.updateItem(
      { paymentId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }
}

export const paymentRepository = new PaymentRepository();
