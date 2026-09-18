import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validation';
import {
  createParkingListingSchema,
  updateParkingListingSchema,
  updateStatusSchema,
} from '../../validators/parkingValidator';
import {
  createListingHandler,
  getListingHandler,
  updateListingHandler,
  deleteListingHandler,
  updateStatusHandler,
  listListingsHandler,
} from './handlers';

export const parkingRouter = Router();

// Create listing (HOST, ADMIN only)
parkingRouter.post(
  '/',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  validate(createParkingListingSchema, 'body'),
  createListingHandler
);

// List listings
parkingRouter.get('/', optionalAuth, listListingsHandler);

// Get single listing
parkingRouter.get('/:id', optionalAuth, getListingHandler);

// Update listing (Owner HOST or ADMIN)
parkingRouter.put(
  '/:id',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  validate(updateParkingListingSchema, 'body'),
  updateListingHandler
);

// Delete listing (Owner HOST or ADMIN)
parkingRouter.delete(
  '/:id',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  deleteListingHandler
);

// Update listing status (Owner HOST or ADMIN)
parkingRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  validate(updateStatusSchema, 'body'),
  updateStatusHandler
);
