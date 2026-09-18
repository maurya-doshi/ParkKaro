import { apiClient } from './client';
import { DEMO_FAVORITES } from './mockData';
import { parkingApi } from './parking';
import { ParkingListing } from '../types/parking';

const MOCK_STORAGE_KEY = 'parkshare_demo_favorites';

function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock favorites', e);
  }
  return [...DEMO_FAVORITES];
}

function saveStoredFavorites(favs: string[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(favs));
  } catch (e) {
    console.error('Error saving mock favorites', e);
  }
}

export const favoritesApi = {
  async list(): Promise<ParkingListing[]> {
    try {
      const res = await apiClient.get<{ items: Array<{ listingId: string }> }>('/favorites');
      if (res.success && res.data?.items) {
        const ids = res.data.items.map((i) => i.listingId);
        const searchResult = await parkingApi.search();
        return searchResult.items.filter((item) => ids.includes(item.listingId));
      }
    } catch {
      // Fallback
    }

    const favIds = getStoredFavorites();
    const searchResult = await parkingApi.search();
    return searchResult.items.filter((item) => favIds.includes(item.listingId));
  },

  async add(listingId: string): Promise<boolean> {
    try {
      const res = await apiClient.post<{ message: string }>(`/favorites/${listingId}`);
      if (res.success) return true;
    } catch {
      // Fallback
    }

    const favs = getStoredFavorites();
    if (!favs.includes(listingId)) {
      saveStoredFavorites([...favs, listingId]);
    }
    return true;
  },

  async remove(listingId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete<{ message: string }>(`/favorites/${listingId}`);
      if (res.success) return true;
    } catch {
      // Fallback
    }

    const favs = getStoredFavorites().filter((id) => id !== listingId);
    saveStoredFavorites(favs);
    return true;
  },

  async isFavorite(listingId: string): Promise<boolean> {
    const favs = getStoredFavorites();
    return favs.includes(listingId);
  }
};
