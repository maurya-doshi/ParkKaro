import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validation';
import {
  createBookingSchema,
  cancelBookingSchema,
  verifyQrSchema,
} from '../../validators/bookingValidator';
import {
  createBookingHandler,
  listBookingsHandler,
  getBookingHandler,
  cancelBookingHandler,
  completeBookingHandler,
  verifyQrHandler,
} from './handlers';

export const bookingRouter = Router();

// POST /bookings — Create booking (DRIVER, ADMIN)
bookingRouter.post(
  '/',
  requireAuth,
  requireRole('DRIVER', 'ADMIN'),
  validate(createBookingSchema, 'body'),
  createBookingHandler
);

// GET /bookings — List user's bookings
bookingRouter.get('/', requireAuth, listBookingsHandler);

// GET /bookings/:id — Get booking details
bookingRouter.get('/:id', requireAuth, getBookingHandler);

// POST /bookings/:id/cancel — Cancel booking
bookingRouter.post(
  '/:id/cancel',
  requireAuth,
  validate(cancelBookingSchema, 'body'),
  cancelBookingHandler
);

// POST /bookings/:id/complete — Complete booking (HOST, ADMIN)
bookingRouter.post(
  '/:id/complete',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  completeBookingHandler
);

// POST /bookings/:id/verify-qr — Verify QR check-in (HOST, ADMIN)
bookingRouter.post(
  '/:id/verify-qr',
  requireAuth,
  requireRole('HOST', 'ADMIN'),
  validate(verifyQrSchema, 'body'),
  verifyQrHandler
);
