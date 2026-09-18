import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Express middleware factory: validates request body/query/params against a Zod schema.
 *
 * Usage:
 *   router.post('/parking', validate(createParkingSchema, 'body'), handler);
 *   router.get('/parking', validate(searchParamsSchema, 'query'), handler);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Replace with parsed (and possibly transformed) data
      (req as any)[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || 'root';
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        }
        return next(new ValidationError('Validation failed', details));
      }
      next(err);
    }
  };
}
