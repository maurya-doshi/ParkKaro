import { Request, Response, NextFunction } from 'express';
import { payoutService } from '../../services/payoutService';
import { sendCreated, sendPaginated } from '../../utils/response';

/**
 * POST /host/payouts
 * Request a payout for eligible host earnings.
 */
export async function createPayoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const userRole = req.user!.role;
    const payout = await payoutService.createPayout(hostId, userRole, req.body);
    sendCreated(res, payout);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /host/payouts
 * List payouts for the authenticated host.
 */
export async function listPayoutsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await payoutService.listHostPayouts(hostId, limit);
    sendPaginated(res, result.items, {
      limit: result.pagination.limit,
      nextToken: result.pagination.nextToken || undefined,
    });
  } catch (err) {
    next(err);
  }
}
