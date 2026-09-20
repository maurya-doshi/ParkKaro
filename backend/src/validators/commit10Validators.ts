import { z } from 'zod';

export const earningsQuerySchema = z.object({
  period: z
    .enum(['7d', '30d', '90d', '12m', 'today', 'week', 'month', 'all'])
    .optional()
    .default('30d'),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
});

export const adminListingStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
});

export const adminUserFilterSchema = z.object({
  role: z.enum(['DRIVER', 'HOST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

export const adminListingFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  area: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

export const adminBookingFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
  driverId: z.string().optional(),
  hostId: z.string().optional(),
  listingId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});
