import { v4 as uuidv4 } from 'uuid';
import { reportRepository } from '../repositories/reportRepository';
import { Report, ReportStatus, ReportTargetType, CreateReportInput } from '../models/Report';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ReportService {
  /**
   * Create a report for a marketplace entity.
   */
  async createReport(userId: string, input: CreateReportInput): Promise<Report> {
    const reportId = `report_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    const report: Report = {
      reportId,
      reportedBy: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return reportRepository.create(report);
  }

  /**
   * Get a report by ID.
   * - Reporter can view their own report.
   * - ADMIN can view all reports.
   */
  async getReportById(reportId: string, userId: string, userRole: string): Promise<Report> {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report', reportId);
    }

    if (report.reportedBy !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view this report');
    }

    return report;
  }

  /**
   * List reports submitted by the authenticated user.
   */
  async listMyReports(userId: string): Promise<Report[]> {
    return reportRepository.findByReportedBy(userId);
  }

  /**
   * Admin: list all reports with optional status filter.
   */
  async listAllReports(userRole: string, status?: ReportStatus): Promise<Report[]> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can list all reports');
    }

    if (status) {
      return reportRepository.findByStatus(status);
    }

    // Fetch all known statuses and merge
    const [pending, reviewed, actioned, dismissed] = await Promise.all([
      reportRepository.findByStatus('PENDING'),
      reportRepository.findByStatus('REVIEWED'),
      reportRepository.findByStatus('ACTIONED'),
      reportRepository.findByStatus('DISMISSED'),
    ]);

    const all = [...pending, ...reviewed, ...actioned, ...dismissed];
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all;
  }

  /**
   * Admin: update report status.
   */
  async updateReportStatus(
    reportId: string,
    adminId: string,
    userRole: string,
    status: ReportStatus
  ): Promise<Report> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can update report status');
    }

    const report = await reportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report', reportId);
    }

    const updated = await reportRepository.updateStatus(reportId, status, adminId);
    if (!updated) {
      throw new NotFoundError('Report', reportId);
    }

    return updated;
  }
}

export const reportService = new ReportService();
