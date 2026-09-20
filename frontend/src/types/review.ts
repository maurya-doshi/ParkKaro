export interface Review {
  reviewId: string;
  listingId: string;
  bookingId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  listingId: string;
  bookingId: string;
  rating: number;
  comment: string;
}
