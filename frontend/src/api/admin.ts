import { apiClient } from './client';
import { AdminAnalytics, Dispute, PlatformReport } from '../types/api';
import { User } from '../types/user';
import { ParkingListing } from '../types/parking';
import { Booking } from '../types/booking';

export const adminApi = {
  /**
   * Platform-wide analytics
   * GET /admin/analytics
   */
  async getAnalytics(): Promise<AdminAnalytics> {
    const res = await apiClient.get<AdminAnalytics>('/admin/analytics');
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch platform analytics');
  },

  /**
   * List users
   * GET /admin/users
   */
  async getUsers(params?: { role?: string; status?: string; limit?: number; nextToken?: string }): Promise<User[]> {
    const res = await apiClient.get<any>('/admin/users', params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * List all listings
   * GET /admin/listings
   */
  async getListings(params?: { status?: string; area?: string; limit?: number; nextToken?: string }): Promise<ParkingListing[]> {
    const res = await apiClient.get<any>('/admin/listings', params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * List all bookings
   * GET /admin/bookings
   */
  async getBookings(params?: { status?: string; limit?: number; nextToken?: string }): Promise<Booking[]> {
    const res = await apiClient.get<any>('/admin/bookings', params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * List disputes
   * GET /admin/disputes
   */
  async getDisputes(params?: { status?: string; limit?: number; nextToken?: string }): Promise<Dispute[]> {
    const res = await apiClient.get<any>('/admin/disputes', params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * List reports
   * GET /admin/reports
   */
  async getReports(params?: { status?: string; limit?: number; nextToken?: string }): Promise<PlatformReport[]> {
    const res = await apiClient.get<any>('/admin/reports', params);
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * Resolve a dispute
   * PATCH /disputes/{id}
   */
  async resolveDispute(disputeId: string, resolution: string): Promise<boolean> {
    const res = await apiClient.patch<any>(`/disputes/${disputeId}`, {
      status: 'RESOLVED',
      resolution
    });
    return !!res?.success;
  }
};
