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
  // 1. If Authorization Bearer token is supplied, decode token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const user = await getCognitoUser(req);
    if (user) return user;
  }

  if (env.authMode === 'demo') {
    return getDemoUser(req);
  }

  // Cognito mode
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
async function getCognitoUser(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const claims = JSON.parse(payloadJson);
          if (claims && (claims.sub || claims.userId || claims.id)) {
            const userId = claims.sub || claims.userId || claims.id;
            const email = claims.email || `${userId}@parkshare.com`;
            const name = claims.name || claims['cognito:username'] || `User ${userId}`;
            const rawRole = (claims['custom:role'] || claims.role || 'DRIVER').toUpperCase();
            const role = rawRole === 'HOST' || rawRole === 'ADMIN' ? rawRole : 'DRIVER';
            return {
              userId,
              email,
              name,
              role,
            };
          }
        } catch {
          // Token decode failed, fallback
        }
      }
    }
  }

  // Fallback to demo headers if present
  return getDemoUser(req);
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
