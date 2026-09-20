import { favoriteRepository } from '../repositories/favoriteRepository';
import { parkingRepository } from '../repositories/parkingRepository';
import { Favorite } from '../models/Favorite';
import { NotFoundError, ConflictError } from '../utils/errors';

export class FavoriteService {
  /**
   * Add a listing to favorites. Prevents duplicates.
   */
  async addFavorite(userId: string, listingId: string): Promise<Favorite> {
    // Verify listing exists
    const listing = await parkingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Parking listing', listingId);
    }

    // Check for duplicate
    const alreadyFavorited = await favoriteRepository.isFavorite(userId, listingId);
    if (alreadyFavorited) {
      throw new ConflictError('This listing is already in your favorites');
    }

    return favoriteRepository.add(userId, listingId);
  }

  /**
   * Remove a listing from favorites.
   */
  async removeFavorite(userId: string, listingId: string): Promise<void> {
    // Verify the favorite exists before trying to remove
    const isFav = await favoriteRepository.isFavorite(userId, listingId);
    if (!isFav) {
      throw new NotFoundError('Favorite', listingId);
    }

    await favoriteRepository.remove(userId, listingId);
  }

  /**
   * List all favorites for a user with listing details.
   */
  async listFavorites(userId: string): Promise<any[]> {
    const favorites = await favoriteRepository.findByUserId(userId);

    // Enrich with listing details
    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        const listing = await parkingRepository.findById(fav.listingId);
        if (!listing) {
          return {
            listingId: fav.listingId,
            addedAt: fav.createdAt,
          };
        }
        return {
          listingId: fav.listingId,
          title: listing.title,
          area: listing.area,
          city: listing.city,
          pricePerHour: listing.pricePerHour,
          rating: listing.rating,
          photos: listing.photos,
          addedAt: fav.createdAt,
        };
      })
    );

    return enriched;
  }

  /**
   * Check if a listing is favorited by a user.
   */
  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    return favoriteRepository.isFavorite(userId, listingId);
  }
}

export const favoriteService = new FavoriteService();
