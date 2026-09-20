import { apiClient } from './client';
import {
  ParkingListing,
  ParkingSearchFilters,
  AvailabilityCheckResponse
} from '../types/parking';
import { PaginatedData } from '../types/api';

export const parkingApi = {
  /**
   * Search parking listings with optional filters (area, city, radius, dates, vehicleType, price, etc.)
   * GET /parking
   */
  async search(filters: ParkingSearchFilters = {}): Promise<PaginatedData<ParkingListing>> {
    const res = await apiClient.get<PaginatedData<ParkingListing>>('/parking', {
      area: filters.area,
      city: filters.city,
      lat: filters.lat,
      lng: filters.lng,
      radius: filters.radius,
      date: filters.date,
      startTime: filters.startTime,
      endTime: filters.endTime,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      parkingType: filters.parkingType,
      vehicleType: filters.vehicleType,
      amenities: filters.amenities,
      rating: filters.rating,
      sortBy: filters.sortBy,
      limit: filters.limit || 20
    });

    if (res && res.data) {
      // If backend returns array directly or items property
      if (Array.isArray(res.data)) {
        return {
          items: res.data,
          pagination: { count: res.data.length, total: res.data.length, nextToken: null, limit: filters.limit || 20 }
        };
      }
      return res.data;
    }

    return {
      items: [],
      pagination: { count: 0, total: 0, nextToken: null, limit: filters.limit || 20 }
    };
  },

  /**
   * Retrieve a single parking listing by ID
   * GET /parking/{id}
   */
  async getById(id: string): Promise<ParkingListing> {
    const res = await apiClient.get<ParkingListing>(`/parking/${id}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Parking listing '${id}' not found`);
  },

  /**
   * Check availability and get pricing estimate for given date/time range
   * GET /parking/{id}/availability
   */
  async checkAvailability(
    id: string,
    date: string,
    startTime?: string,
    endTime?: string
  ): Promise<AvailabilityCheckResponse> {
    const res = await apiClient.get<AvailabilityCheckResponse>(`/parking/${id}/availability`, {
      date,
      startTime,
      endTime
    });
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Could not fetch availability for listing '${id}'`);
  },

  /**
   * Create a new parking listing (HOST / ADMIN)
   * POST /parking
   */
  async create(data: Partial<ParkingListing>): Promise<ParkingListing> {
    const res = await apiClient.post<ParkingListing>('/parking', data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to create parking listing');
  },

  /**
   * Update an existing parking listing (HOST / ADMIN)
   * PUT /parking/{id}
   */
  async update(id: string, data: Partial<ParkingListing>): Promise<ParkingListing> {
    const res = await apiClient.put<ParkingListing>(`/parking/${id}`, data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to update listing '${id}'`);
  },

  /**
   * Soft-delete a parking listing (HOST / ADMIN)
   * DELETE /parking/{id}
   */
  async delete(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ message: string }>(`/parking/${id}`);
    return !!res?.success;
  },

  /**
   * Update listing status (ACTIVE / INACTIVE / SUSPENDED)
   * PATCH /parking/{id}/status
   */
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<ParkingListing> {
    const res = await apiClient.patch<ParkingListing>(`/parking/${id}/status`, { status });
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to update status for listing '${id}'`);
  },

  /**
   * Get reviews for a parking listing
   * GET /parking/{id}/reviews
   */
  async getReviews(id: string): Promise<any[]> {
    const res = await apiClient.get<any>(`/parking/${id}/reviews`);
    if (res && res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.items)) return res.data.items;
    }
    return [];
  }
};
