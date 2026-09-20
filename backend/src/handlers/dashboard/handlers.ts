import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../../services/dashboardService';
import { sendSuccess } from '../../utils/response';
import { ForbiddenError } from '../../utils/errors';

export async function getHostDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    if (role !== 'HOST' && role !== 'ADMIN') {
      throw new ForbiddenError('Only hosts and administrators can access the host dashboard');
    }

    const data = await dashboardService.getHostDashboard(userId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getHostListingsSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    if (role !== 'HOST' && role !== 'ADMIN') {
      throw new ForbiddenError('Only hosts and administrators can access host listings summary');
    }

    const items = await dashboardService.getHostListingsSummary(userId);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function getHostEarningsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    if (role !== 'HOST' && role !== 'ADMIN') {
      throw new ForbiddenError('Only hosts and administrators can access host earnings');
    }

    const period = (req.query.period as string) || '30d';
    const data = await dashboardService.getHostEarningsAnalytics(userId, period);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getDriverDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    if (role !== 'DRIVER' && role !== 'ADMIN') {
      throw new ForbiddenError('Only drivers and administrators can access the driver dashboard');
    }

    const data = await dashboardService.getDriverDashboard(userId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
