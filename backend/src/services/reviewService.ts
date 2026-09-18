import { v4 as uuidv4 } from 'uuid';
import { reviewRepository } from '../repositories/reviewRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { parkingRepository } from '../repositories/parkingRepository';
import { Review, CreateReviewInput } from '../models/Review';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';

export class ReviewService {
  /**
   * Create a review for a completed booking.
   * Enforces:
   *   - Booking must exist and be COMPLETED
   *   - Reviewer must be the driver who booked
   *   - Listing must match the booking's listing
   *   - No duplicate reviews per booking
   */
  async createReview(
    userId: string,
    input: CreateReviewInput
  ): Promise<Review> {
    // Verify booking exists
    const booking = await bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Verify booking is completed
    if (booking.bookingStatus !== 'COMPLETED') {
      throw new ValidationError('Reviews can only be submitted for completed bookings');
    }

    // Verify reviewer is the driver who made the booking
    if (booking.driverId !== userId) {
      throw new ForbiddenError('You can only review bookings you made');
    }

    // Verify the listing matches the booking
    if (booking.listingId !== input.listingId) {
      throw new ValidationError('Listing ID does not match the booking');
    }

    // Prevent duplicate reviews for the same booking
    const existingReview = await reviewRepository.findByBookingId(input.bookingId);
    if (existingReview) {
      throw new ConflictError('You have already reviewed this booking');
    }

    const reviewId = `review_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    const review: Review = {
      reviewId,
      listingId: input.listingId,
      bookingId: input.bookingId,
      userId,
      rating: input.rating,
      comment: input.comment,
      createdAt: timestamp,
    };

    const created = await reviewRepository.create(review);

    // Update listing rating asynchronously (best-effort)
    try {
      await this.updateListingRating(input.listingId);
    } catch {
      // Non-critical: listing rating update can fail without blocking review creation
    }

    return created;
  }

  /**
   * Get all reviews for a listing.
   */
  async getListingReviews(
    listingId: string,
    limit = 50
  ): Promise<{ items: Review[]; pagination: { count: number; limit: number; nextToken: null } }> {
    const reviews = await reviewRepository.findByListingId(listingId);
    reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const paginated = reviews.slice(0, limit);
    return {
      items: paginated,
      pagination: {
        count: paginated.length,
        limit,
        nextToken: null,
      },
    };
  }

  /**
   * Get all reviews by a specific user.
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    return reviewRepository.findByUserId(userId);
  }

  /**
   * Get a single review by ID.
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review', reviewId);
    }
    return review;
  }

  /**
   * Recalculate and update the listing's average rating.
   */
  private async updateListingRating(listingId: string): Promise<void> {
    const reviews = await reviewRepository.findByListingId(listingId);
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const rounded = Math.round(avgRating * 10) / 10;

    await parkingRepository.updateRating(listingId, rounded, reviews.length);
  }
}

export const reviewService = new ReviewService();
