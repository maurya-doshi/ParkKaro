import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../../services/favoriteService';
import { sendSuccess, sendCreated } from '../../utils/response';

/**
 * POST /favorites/:parkingId
 */
export async function addFavoriteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const favorite = await favoriteService.addFavorite(req.user!.userId, req.params.parkingId);
    sendCreated(res, { listingId: favorite.listingId, message: 'Added to favorites' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /favorites/:parkingId
 */
export async function removeFavoriteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await favoriteService.removeFavorite(req.user!.userId, req.params.parkingId);
    sendSuccess(res, { message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /favorites
 */
export async function listFavoritesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await favoriteService.listFavorites(req.user!.userId);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /favorites/:parkingId/check
 */
export async function checkFavoriteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isFavorite = await favoriteService.isFavorite(req.user!.userId, req.params.parkingId);
    sendSuccess(res, { listingId: req.params.parkingId, isFavorite });
  } catch (err) {
    next(err);
  }
}
