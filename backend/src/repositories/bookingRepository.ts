import { BaseRepository } from './baseRepository';
import { Booking, BookingStatus, PaymentStatus } from '../models/Booking';

export class BookingRepository extends BaseRepository<Booking> {
  constructor() {
    super('bookings');
  }

  async create(booking: Booking): Promise<Booking> {
    return this.putItem(booking);
  }

  async findById(bookingId: string): Promise<Booking | null> {
    return this.getItem({ bookingId });
  }

  async findByDriverId(driverId: string): Promise<Booking[]> {
    return this.queryItems({
      IndexName: 'driverId-index',
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId,
      },
    });
  }

  async findByHostId(hostId: string): Promise<Booking[]> {
    return this.queryItems({
      IndexName: 'hostId-index',
      KeyConditionExpression: 'hostId = :hostId',
      ExpressionAttributeValues: {
        ':hostId': hostId,
      },
    });
  }

  async findByListingId(listingId: string, startTimeFrom?: string): Promise<Booking[]> {
    if (startTimeFrom) {
      return this.queryItems({
        IndexName: 'listingId-index',
        KeyConditionExpression: 'listingId = :listingId AND startTime >= :startTime',
        ExpressionAttributeValues: {
          ':listingId': listingId,
          ':startTime': startTimeFrom,
        },
      });
    }

    return this.queryItems({
      IndexName: 'listingId-index',
      KeyConditionExpression: 'listingId = :listingId',
      ExpressionAttributeValues: {
        ':listingId': listingId,
      },
    });
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return this.queryItems({
      IndexName: 'status-index',
      KeyConditionExpression: 'bookingStatus = :status',
      ExpressionAttributeValues: {
        ':status': status,
      },
    });
  }

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    cancellation?: { reason?: string; cancelledBy?: string; cancelledAt?: string }
  ): Promise<Booking | null> {
    const updateExpressions: string[] = [
      '#bookingStatus = :status',
      '#updatedAt = :updatedAt',
    ];
    const expressionAttributeNames: Record<string, string> = {
      '#bookingStatus': 'bookingStatus',
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    if (cancellation) {
      if (cancellation.reason) {
        updateExpressions.push('#cancellationReason = :cancellationReason');
        expressionAttributeNames['#cancellationReason'] = 'cancellationReason';
        expressionAttributeValues[':cancellationReason'] = cancellation.reason;
      }
      if (cancellation.cancelledBy) {
        updateExpressions.push('#cancelledBy = :cancelledBy');
        expressionAttributeNames['#cancelledBy'] = 'cancelledBy';
        expressionAttributeValues[':cancelledBy'] = cancellation.cancelledBy;
      }
      if (cancellation.cancelledAt) {
        updateExpressions.push('#cancelledAt = :cancelledAt');
        expressionAttributeNames['#cancelledAt'] = 'cancelledAt';
        expressionAttributeValues[':cancelledAt'] = cancellation.cancelledAt;
      }
    }

    return this.updateItem(
      { bookingId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }

  async updatePaymentStatus(bookingId: string, status: PaymentStatus): Promise<Booking | null> {
    return this.updateItem(
      { bookingId },
      'SET #paymentStatus = :status, #updatedAt = :updatedAt',
      {
        '#paymentStatus': 'paymentStatus',
        '#updatedAt': 'updatedAt',
      },
      {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      }
    );
  }
}

export const bookingRepository = new BookingRepository();
