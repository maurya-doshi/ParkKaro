import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../../services/paymentService';
import { sendSuccess, sendCreated } from '../../utils/response';

/**
 * POST /payments (and /payments/create)
 * Create payment record for a booking.
 */
export async function createPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { bookingId } = req.body;

    const payment = await paymentService.createPayment(userId, userRole, bookingId);
    sendCreated(res, payment);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:id
 * Retrieve payment details.
 */
export async function getPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const payment = await paymentService.getPaymentById(req.params.id, userId, userRole);
    sendSuccess(res, payment);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:id/process (and /payments/:id/confirm)
 * Process payment transaction.
 */
export async function processPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const payment = await paymentService.processPayment(
      req.params.id,
      userId,
      userRole,
      req.body
    );
    sendSuccess(res, payment);
  } catch (err) {
    next(err);
  }
}
