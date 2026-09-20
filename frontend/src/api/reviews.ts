import { apiClient } from './client';
import { Review, CreateReviewInput } from '../types/review';

export const reviewsApi = {
  /**
   * Get reviews for a parking listing
   * GET /parking/{id}/reviews
   */
  async getByListing(listingId: string): Promise<Review[]> {
    const res = await apiClient.get<any>(`/parking/${listingId}/reviews`);
    if (res && res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.items)) return res.data.items;
    }
    return [];
  },

  /**
   * Create a review for a completed booking
   * POST /reviews
   */
  async create(input: CreateReviewInput): Promise<Review> {
    const res = await apiClient.post<Review>('/reviews', {
      listingId: input.listingId,
      bookingId: input.bookingId,
      rating: input.rating,
      comment: input.comment
    });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to submit review');
  }
};
