import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

type Role = 'DRIVER' | 'HOST' | 'ADMIN';

/**
 * Express middleware factory: restricts access to specific roles.
 * Must be used AFTER requireAuth middleware.
 *
 * Usage:
 *   router.get('/admin/users', requireAuth, requireRole('ADMIN'), handler);
 *   router.post('/parking', requireAuth, requireRole('HOST', 'ADMIN'), handler);
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}
