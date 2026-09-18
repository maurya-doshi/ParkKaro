import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Authenticated user attached to the request.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: 'DRIVER' | 'HOST' | 'ADMIN';
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extract authenticated user from the request.
 * This is the SINGLE interface Person 3 replaces with Cognito JWT verification.
 *
 * - In 'demo' mode: reads X-Demo-User-Id, X-Demo-Email, X-Demo-Name, X-Demo-Role headers
 * - In 'cognito' mode: verifies JWT Bearer token against Cognito User Pool
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  if (env.authMode === 'demo') {
    return getDemoUser(req);
  }

  // Cognito mode — Person 3 implements this
  return getCognitoUser(req);
}

/**
 * Demo authentication: reads simulated identity from headers.
 * NEVER use in production.
 */
function getDemoUser(req: Request): AuthenticatedUser | null {
  const userId = req.headers['x-demo-user-id'] as string;
  const role = req.headers['x-demo-role'] as string;

  if (!userId || !role) {
    return null;
  }

  return {
    userId,
    email: (req.headers['x-demo-email'] as string) || `${userId}@demo.parkshare.com`,
    name: (req.headers['x-demo-name'] as string) || `Demo User ${userId}`,
    role: role.toUpperCase() as 'DRIVER' | 'HOST' | 'ADMIN',
  };
}

/**
 * Cognito JWT verification — Person 3 replaces this implementation.
 * This stub always returns null (unauthenticated) until Cognito is configured.
 */
async function getCognitoUser(_req: Request): Promise<AuthenticatedUser | null> {
  // TODO: Person 3 — Implement Cognito JWT verification here.
  //
  // Expected implementation:
  // 1. Extract Bearer token from Authorization header
  // 2. Verify JWT signature against Cognito User Pool
  // 3. Extract claims (sub, email, name, custom:role)
  // 4. Return AuthenticatedUser or null
  //
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token) return null;
  // const claims = await verifyCognitoToken(token);
  // return { userId: claims.sub, email: claims.email, name: claims.name, role: claims['custom:role'] };

  return null;
}

/**
 * Express middleware: requires authentication.
 * Attaches user to req.user or returns 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  getAuthenticatedUser(req)
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      req.user = user;
      next();
    })
    .catch(next);
}

/**
 * Express middleware: optional authentication.
 * Attaches user to req.user if present, otherwise continues without user.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  getAuthenticatedUser(req)
    .then((user) => {
      if (user) {
        req.user = user;
      }
      next();
    })
    .catch(next);
}
