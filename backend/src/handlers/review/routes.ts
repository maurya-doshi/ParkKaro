import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createReviewSchema } from '../../validators/reviewValidator';
import {
  createReviewHandler,
  getListingReviewsHandler,
  getMyReviewsHandler,
  getReviewHandler,
} from './handlers';

export const reviewRouter = Router();

// POST /reviews
reviewRouter.post('/', requireAuth, validate(createReviewSchema, 'body'), createReviewHandler);

// GET /reviews/me
reviewRouter.get('/me', requireAuth, getMyReviewsHandler);

// GET /reviews/listing/:listingId
reviewRouter.get('/listing/:listingId', optionalAuth, getListingReviewsHandler);

// GET /reviews/:id
reviewRouter.get('/:id', optionalAuth, getReviewHandler);
