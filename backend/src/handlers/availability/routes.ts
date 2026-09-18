import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { availabilityQuerySchema } from '../../validators/availabilityValidator';
import { getAvailabilityHandler } from './handlers';

export const availabilityRouter = Router();

// GET /parking/:id/availability
availabilityRouter.get(
  '/:id/availability',
  optionalAuth,
  validate(availabilityQuerySchema, 'query'),
  getAvailabilityHandler
);
