import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * - Converts AppError subclasses to structured responses
 * - Catches unknown errors without leaking stack traces
 * - Logs technical details for debugging
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Already sent a response
  if (res.headersSent) {
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    const details = err instanceof ValidationError ? err.details : undefined;

    if (!err.isOperational) {
      console.error('[INTERNAL ERROR]', err.message, err.stack);
    }

    sendError(res, err.statusCode, err.code, err.message, details);
    return;
  }

  // Unknown / programming errors
  console.error('[UNHANDLED ERROR]', err.message, err.stack);
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
