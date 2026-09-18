import { BaseRepository } from './baseRepository';
import { Favorite } from '../models/Favorite';

export class FavoriteRepository extends BaseRepository<Favorite> {
  constructor() {
    super('favorites');
  }

  async add(userId: string, listingId: string): Promise<Favorite> {
    const favorite: Favorite = {
      userId,
      listingId,
      createdAt: new Date().toISOString(),
    };
    return this.putItem(favorite);
  }

  async remove(userId: string, listingId: string): Promise<void> {
    return this.deleteItem({ userId, listingId });
  }

  async findByUserId(userId: string): Promise<Favorite[]> {
    return this.queryItems({
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const item = await this.getItem({ userId, listingId });
    return item !== null;
  }
}

export const favoriteRepository = new FavoriteRepository();
