import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../../services/availabilityService';
import { sendSuccess } from '../../utils/response';

/**
 * GET /parking/:id/availability
 * Check slot availability and retrieve pricing estimate.
 */
export async function getAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listingId = req.params.id;
    const result = await availabilityService.checkAvailability(listingId, req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
