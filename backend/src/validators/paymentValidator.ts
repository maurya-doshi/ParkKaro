import { z } from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive().optional(), // Ignored by backend (server uses booking.totalAmount)
  currency: z.string().default('INR').optional(),
});

export const processPaymentSchema = z.object({
  providerRef: z.string().optional(),
  force_failure: z.string().optional(),
  failure_reason: z.string().optional(),
});

export type CreatePaymentBody = z.infer<typeof createPaymentSchema>;
