import { z } from 'zod';

export const createBookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const verifyQrSchema = z.object({
  verificationCode: z.string().min(1).optional(),
  qrData: z.string().optional(),
});

export type CreateBookingParams = z.infer<typeof createBookingSchema>;
export type CancelBookingParams = z.infer<typeof cancelBookingSchema>;
