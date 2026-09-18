import { BaseRepository } from './baseRepository';
import { Report, ReportStatus } from '../models/Report';

export class ReportRepository extends BaseRepository<Report> {
  constructor() {
    super('reports');
  }

  async create(report: Report): Promise<Report> {
    return this.putItem(report);
  }

  async findById(reportId: string): Promise<Report | null> {
    return this.getItem({ reportId });
  }

  async findByStatus(status: ReportStatus): Promise<Report[]> {
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

  async findByReportedBy(reportedBy: string): Promise<Report[]> {
    return this.queryItems({
      IndexName: 'reportedBy-index',
      KeyConditionExpression: 'reportedBy = :reportedBy',
      ExpressionAttributeValues: {
        ':reportedBy': reportedBy,
      },
    });
  }

  async updateStatus(
    reportId: string,
    status: ReportStatus,
    reviewedBy?: string
  ): Promise<Report | null> {
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

    if (reviewedBy) {
      updateExpressions.push('#reviewedBy = :reviewedBy');
      expressionAttributeNames['#reviewedBy'] = 'reviewedBy';
      expressionAttributeValues[':reviewedBy'] = reviewedBy;
    }

    return this.updateItem(
      { reportId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }
}

export const reportRepository = new ReportRepository();
