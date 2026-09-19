import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../../services/bookingService';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';

/**
 * POST /bookings
 * Create a new booking (DRIVER only).
 */
export async function createBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = req.user!.userId;
    const booking = await bookingService.createBooking(driverId, req.body);
    sendCreated(res, booking);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /bookings
 * List authenticated user's bookings.
 */
export async function listBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const status = req.query.status as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await bookingService.listUserBookings(userId, userRole, status, limit);
    sendPaginated(res, result.items, {
      limit: result.pagination.limit,
      nextToken: result.pagination.nextToken || undefined,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /bookings/:id
 * Get booking by ID.
 */
export async function getBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const booking = await bookingService.getBookingById(req.params.id, userId, userRole);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /bookings/:id/cancel
 * Cancel a booking.
 */
export async function cancelBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await bookingService.cancelBooking(req.params.id, userId, userRole, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /bookings/:id/complete
 * Mark booking as complete.
 */
export async function completeBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await bookingService.completeBooking(req.params.id, userId, userRole);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /bookings/:id/verify-qr
 * Verify QR access and check-in.
 */
export async function verifyQrHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await bookingService.verifyQr(
      req.params.id,
      userId,
      userRole,
      req.body.verificationCode
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
