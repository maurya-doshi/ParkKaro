import { z } from 'zod';

export const createPayoutSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format').optional(),
  bookingIds: z.array(z.string()).optional(),
});
