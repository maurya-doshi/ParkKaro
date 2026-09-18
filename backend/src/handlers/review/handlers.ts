import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../../services/reviewService';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';

/**
 * POST /reviews
 */
export async function createReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const review = await reviewService.createReview(req.user!.userId, req.body);
    sendCreated(res, review);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reviews/listing/:listingId
 * Also served as GET /parking/:id/reviews (via app.ts parking router)
 */
export async function getListingReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await reviewService.getListingReviews(req.params.listingId, limit);
    sendPaginated(res, result.items, {
      limit: result.pagination.limit,
      nextToken: result.pagination.nextToken || undefined,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reviews/me
 * Get the authenticated user's own reviews.
 */
export async function getMyReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await reviewService.getUserReviews(req.user!.userId);
    sendSuccess(res, { items: reviews });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reviews/:id
 */
export async function getReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
}
