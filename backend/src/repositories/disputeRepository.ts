import { BaseRepository } from './baseRepository';
import { Dispute, DisputeStatus } from '../models/Dispute';

export class DisputeRepository extends BaseRepository<Dispute> {
  constructor() {
    super('disputes');
  }

  async create(dispute: Dispute): Promise<Dispute> {
    return this.putItem(dispute);
  }

  async findById(disputeId: string): Promise<Dispute | null> {
    return this.getItem({ disputeId });
  }

  async findByBookingId(bookingId: string): Promise<Dispute[]> {
    return this.queryItems({
      IndexName: 'bookingId-index',
      KeyConditionExpression: 'bookingId = :bookingId',
      ExpressionAttributeValues: {
        ':bookingId': bookingId,
      },
    });
  }

  async findByStatus(status: DisputeStatus): Promise<Dispute[]> {
    return this.queryItems({
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
      },
    });
  }

  async findByReportedBy(reportedBy: string): Promise<Dispute[]> {
    return this.queryItems({
      IndexName: 'reportedBy-index',
      KeyConditionExpression: 'reportedBy = :reportedBy',
      ExpressionAttributeValues: {
        ':reportedBy': reportedBy,
      },
    });
  }

  async resolve(
    disputeId: string,
    resolution: string,
    resolvedBy: string,
    status: DisputeStatus = 'RESOLVED'
  ): Promise<Dispute | null> {
    return this.updateItem(
      { disputeId },
      'SET #status = :status, #resolution = :resolution, #resolvedBy = :resolvedBy, #updatedAt = :updatedAt',
      {
        '#status': 'status',
        '#resolution': 'resolution',
        '#resolvedBy': 'resolvedBy',
        '#updatedAt': 'updatedAt',
      },
      {
        ':status': status,
        ':resolution': resolution,
        ':resolvedBy': resolvedBy,
        ':updatedAt': new Date().toISOString(),
      }
    );
  }
}

export const disputeRepository = new DisputeRepository();
