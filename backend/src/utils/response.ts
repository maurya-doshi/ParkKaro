import { Response } from 'express';

/**
 * Standard API response format.
 * 
 * Success: { success: true, data: T }
 * Error:   { success: false, error: { code: string, message: string, details?: any } }
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): void {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details) {
    body.error.details = details;
  }
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: { total?: number; nextToken?: string; limit: number }
): void {
  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        count: items.length,
        total: pagination.total,
        nextToken: pagination.nextToken,
        limit: pagination.limit,
      },
    },
  });
}
