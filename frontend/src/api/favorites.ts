import { apiClient } from './client';

export interface FavoriteItem {
  listingId: string;
  title?: string;
  area?: string;
  pricePerHour?: number;
  rating?: number;
  addedAt?: string;
}

export const favoritesApi = {
  /**
   * List user's favorites
   * GET /favorites
   */
  async list(): Promise<FavoriteItem[]> {
    const res = await apiClient.get<{ items: FavoriteItem[] }>('/favorites');
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data as any;
    }
    return [];
  },

  /**
   * Add a listing to favorites
   * POST /favorites/{parkingId}
   */
  async add(listingId: string): Promise<boolean> {
    const res = await apiClient.post<{ listingId: string; message: string }>(`/favorites/${listingId}`);
    return !!res?.success;
  },

  /**
   * Remove listing from favorites
   * DELETE /favorites/{parkingId}
   */
  async remove(listingId: string): Promise<boolean> {
    const res = await apiClient.delete<{ message: string }>(`/favorites/${listingId}`);
    return !!res?.success;
  },

  /**
   * Check if a listing is in user's favorites
   */
  async isFavorite(listingId: string): Promise<boolean> {
    try {
      const items = await this.list();
      return items.some((item) => item.listingId === listingId);
    } catch {
      return false;
    }
  }
};
