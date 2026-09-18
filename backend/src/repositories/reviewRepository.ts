import { BaseRepository } from './baseRepository';
import { Review } from '../models/Review';

export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  async create(review: Review): Promise<Review> {
    return this.putItem(review);
  }

  async findById(reviewId: string): Promise<Review | null> {
    return this.getItem({ reviewId });
  }

  async findByListingId(listingId: string): Promise<Review[]> {
    return this.queryItems({
      IndexName: 'listingId-index',
      KeyConditionExpression: 'listingId = :listingId',
      ExpressionAttributeValues: {
        ':listingId': listingId,
      },
    });
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return this.queryItems({
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<Review | null> {
    const items = await this.queryItems({
      IndexName: 'bookingId-index',
      KeyConditionExpression: 'bookingId = :bookingId',
      ExpressionAttributeValues: {
        ':bookingId': bookingId,
      },
    });
    return items[0] || null;
  }
}

export const reviewRepository = new ReviewRepository();
