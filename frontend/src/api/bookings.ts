import { apiClient } from './client';
import { Booking, CreateBookingRequest } from '../types/booking';
import { PaginatedData } from '../types/api';

export const bookingsApi = {
  /**
   * List authenticated user's bookings (DRIVER / HOST)
   * GET /bookings
   */
  async list(params?: { status?: string; limit?: number; nextToken?: string }): Promise<PaginatedData<Booking>> {
    const res = await apiClient.get<PaginatedData<Booking>>('/bookings', params);
    if (res && res.data) {
      if (Array.isArray(res.data)) {
        return {
          items: res.data,
          pagination: { count: res.data.length, total: res.data.length, nextToken: null, limit: params?.limit || 20 }
        };
      }
      return res.data;
    }
    return {
      items: [],
      pagination: { count: 0, total: 0, nextToken: null, limit: params?.limit || 20 }
    };
  },

  /**
   * Get a specific booking by ID
   * GET /bookings/{id}
   */
  async getById(id: string): Promise<Booking> {
    const res = await apiClient.get<Booking>(`/bookings/${id}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Booking '${id}' not found`);
  },

  /**
   * Create a new booking
   * POST /bookings
   */
  async create(req: CreateBookingRequest): Promise<Booking> {
    const res = await apiClient.post<Booking>('/bookings', req);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to create booking');
  },

  /**
   * Cancel a booking
   * POST /bookings/{id}/cancel
   */
  async cancel(id: string, reason: string = 'Plans changed'): Promise<Booking> {
    const res = await apiClient.post<Booking>(`/bookings/${id}/cancel`, { reason });
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to cancel booking '${id}'`);
  },

  /**
   * Mark a booking as completed (HOST / ADMIN)
   * POST /bookings/{id}/complete
   */
  async complete(id: string): Promise<Booking> {
    const res = await apiClient.post<Booking>(`/bookings/${id}/complete`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to complete booking '${id}'`);
  }
};
