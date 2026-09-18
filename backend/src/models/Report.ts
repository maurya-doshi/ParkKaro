/**
 * Report model — corresponds to parkshare-reports table.
 */

export type ReportTargetType = 'LISTING' | 'USER' | 'BOOKING' | 'MESSAGE';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';

export interface Report {
  reportId: string;
  reportedBy: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
}
