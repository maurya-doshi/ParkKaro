import { z } from 'zod';

export const createReviewSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment must be under 1000 characters'),
});

export type CreateReviewBody = z.infer<typeof createReviewSchema>;
