import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { earningsQuerySchema } from '../../validators/commit10Validators';
import {
  getHostDashboardHandler,
  getHostListingsSummaryHandler,
  getHostEarningsHandler,
  getDriverDashboardHandler,
} from './handlers';

export const dashboardRouter = Router();

// GET /host/dashboard
dashboardRouter.get('/host/dashboard', requireAuth, getHostDashboardHandler);

// GET /host/listings-summary
dashboardRouter.get('/host/listings-summary', requireAuth, getHostListingsSummaryHandler);

// GET /host/earnings
dashboardRouter.get(
  '/host/earnings',
  requireAuth,
  validate(earningsQuerySchema, 'query'),
  getHostEarningsHandler
);

// GET /driver/dashboard
dashboardRouter.get('/driver/dashboard', requireAuth, getDriverDashboardHandler);
