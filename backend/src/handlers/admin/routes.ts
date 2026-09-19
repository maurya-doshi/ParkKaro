import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  adminUserStatusSchema,
  adminListingStatusSchema,
  adminUserFilterSchema,
  adminListingFilterSchema,
  adminBookingFilterSchema,
} from '../../validators/commit10Validators';
import {
  getAdminDashboardHandler,
  getAdminActivityHandler,
  listUsersHandler,
  getUserHandler,
  updateUserStatusHandler,
  listListingsHandler,
  getListingHandler,
  updateListingStatusHandler,
  listBookingsHandler,
  listDisputesHandler,
  listReportsHandler,
} from './handlers';

export const adminRouter = Router();

// GET /admin/dashboard & GET /admin/analytics
adminRouter.get('/dashboard', requireAuth, getAdminDashboardHandler);
adminRouter.get('/analytics', requireAuth, getAdminDashboardHandler);

// GET /admin/activity
adminRouter.get('/activity', requireAuth, getAdminActivityHandler);

// ─── Users ───────────────────────────────────────────────────
adminRouter.get('/users', requireAuth, validate(adminUserFilterSchema, 'query'), listUsersHandler);
adminRouter.get('/users/:id', requireAuth, getUserHandler);
adminRouter.patch(
  '/users/:id/status',
  requireAuth,
  validate(adminUserStatusSchema, 'body'),
  updateUserStatusHandler
);

// ─── Listings ────────────────────────────────────────────────
adminRouter.get('/listings', requireAuth, validate(adminListingFilterSchema, 'query'), listListingsHandler);
adminRouter.get('/listings/:id', requireAuth, getListingHandler);
adminRouter.patch(
  '/listings/:id/status',
  requireAuth,
  validate(adminListingStatusSchema, 'body'),
  updateListingStatusHandler
);

// ─── Bookings ────────────────────────────────────────────────
adminRouter.get('/bookings', requireAuth, validate(adminBookingFilterSchema, 'query'), listBookingsHandler);

// ─── Disputes & Reports ──────────────────────────────────────
adminRouter.get('/disputes', requireAuth, listDisputesHandler);
adminRouter.get('/reports', requireAuth, listReportsHandler);
