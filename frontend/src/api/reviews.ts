import { apiClient } from './client';
import { Review, CreateReviewInput } from '../types/review';
import { DEMO_REVIEWS } from './mockData';

const MOCK_STORAGE_KEY = 'parkshare_demo_reviews';

function getStoredReviews(): Review[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock reviews', e);
  }
  return [...DEMO_REVIEWS];
}

function saveStoredReviews(reviews: Review[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Error saving mock reviews', e);
  }
}

export const reviewsApi = {
  async getByListing(listingId: string): Promise<Review[]> {
    try {
      const res = await apiClient.get<{ items: Review[] }>(`/parking/${listingId}/reviews`);
      if (res.success && res.data?.items) {
        return res.data.items;
      }
    } catch {
      // Fallback
    }

    const reviews = getStoredReviews();
    return reviews.filter((r) => r.listingId === listingId);
  },

  async create(input: CreateReviewInput): Promise<Review> {
    try {
      const res = await apiClient.post<Review>('/reviews', input);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const current = getStoredReviews();
    const newReview: Review = {
      reviewId: `rev_${Date.now().toString(36)}`,
      listingId: input.listingId,
      bookingId: input.bookingId,
      userId: 'user_driver1',
      userName: 'Arjun Verma',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString()
    };

    saveStoredReviews([newReview, ...current]);
    return newReview;
  }
};
