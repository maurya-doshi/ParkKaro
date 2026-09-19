import { z } from 'zod';

export const createConversationSchema = z.object({
  otherUserId: z.string().min(1, 'Other user ID is required'),
  listingId: z.string().optional(),
  bookingId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000),
});

export const createDisputeSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(1, 'Reason is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  evidence: z.array(z.string()).optional(),
});

export const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
  resolution: z.string().max(2000).optional(),
});

export const createReportSchema = z.object({
  targetType: z.enum(['LISTING', 'USER', 'BOOKING', 'MESSAGE']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().min(1, 'Reason is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED']),
});
