import { Request, Response, NextFunction } from 'express';
import { parkingService } from '../../services/parkingService';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';

/**
 * POST /parking
 * Create a new parking listing.
 */
export async function createListingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const listing = await parkingService.createListing(hostId, req.body);
    sendCreated(res, listing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /parking/:id
 * Retrieve a single listing by ID.
 */
export async function getListingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listing = await parkingService.getListingById(req.params.id);
    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /parking/:id
 * Update an existing listing.
 */
export async function updateListingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const listing = await parkingService.updateListing(req.params.id, userId, userRole, req.body);
    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /parking/:id
 * Soft-delete a listing.
 */
export async function deleteListingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    await parkingService.deleteListing(req.params.id, userId, userRole);
    sendSuccess(res, { message: 'Listing deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /parking/:id/status
 * Update listing status (ACTIVE / INACTIVE / SUSPENDED).
 */
export async function updateStatusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const listing = await parkingService.updateStatus(req.params.id, userId, userRole, req.body.status);
    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /parking
 * Basic listing endpoint for active listings or host's listings (full search engine added in Commit 4).
 */
export async function listListingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hostId = req.query.hostId as string;
    if (hostId) {
      const items = await parkingService.getHostListings(hostId);
      sendPaginated(res, items, { limit: items.length });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await parkingService.listActiveListings(limit);
    sendPaginated(res, result.items, { limit });
  } catch (err) {
    next(err);
  }
}
