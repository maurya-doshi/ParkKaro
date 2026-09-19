import { Request, Response, NextFunction } from 'express';
import { reportService } from '../../services/reportService';
import { sendSuccess, sendCreated } from '../../utils/response';
import { ReportStatus } from '../../models/Report';

export async function createReportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.createReport(req.user!.userId, req.body);
    sendCreated(res, report);
  } catch (err) { next(err); }
}

export async function getReportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.getReportById(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, report);
  } catch (err) { next(err); }
}

export async function listMyReportsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await reportService.listMyReports(req.user!.userId);
    sendSuccess(res, { items });
  } catch (err) { next(err); }
}

export async function listAllReportsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as ReportStatus | undefined;
    const items = await reportService.listAllReports(req.user!.role, status);
    sendSuccess(res, { items });
  } catch (err) { next(err); }
}

export async function updateReportStatusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.updateReportStatus(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body.status
    );
    sendSuccess(res, report);
  } catch (err) { next(err); }
}
