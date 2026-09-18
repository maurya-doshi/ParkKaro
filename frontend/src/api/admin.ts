import { apiClient } from './client';
import { AdminAnalytics, Dispute, PlatformReport } from '../types/api';
import { User } from '../types/user';
import { ParkingListing } from '../types/parking';
import { parkingApi } from './parking';
import { DEMO_USERS } from './mockData';

export const adminApi = {
  async getAnalytics(): Promise<AdminAnalytics> {
    try {
      const res = await apiClient.get<AdminAnalytics>('/admin/analytics');
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    return {
      totalUsers: 248,
      totalDrivers: 196,
      totalHosts: 52,
      totalListings: 47,
      activeListings: 42,
      totalBookings: 612,
      totalRevenue: 284500,
      platformEarnings: 28450,
      averageRating: 4.8,
      bookingsToday: 18,
      revenueToday: 5400
    };
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<{ items: User[] }>('/admin/users');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    return Object.values(DEMO_USERS);
  },

  async getListings(): Promise<ParkingListing[]> {
    try {
      const res = await apiClient.get<{ items: ParkingListing[] }>('/admin/listings');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    const { items } = await parkingApi.search();
    return items;
  },

  async getDisputes(): Promise<Dispute[]> {
    try {
      const res = await apiClient.get<{ items: Dispute[] }>('/admin/disputes');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    return [
      {
        disputeId: 'disp_01',
        bookingId: 'booking_past103',
        raisedBy: 'user_driver1',
        reason: 'Unauthorized vehicle blocking entrance',
        description: 'Gate was blocked by a delivery truck for 15 minutes upon arrival.',
        status: 'OPEN',
        createdAt: '2026-09-16T12:00:00.000Z',
        updatedAt: '2026-09-16T12:00:00.000Z'
      }
    ];
  },

  async getReports(): Promise<PlatformReport[]> {
    try {
      const res = await apiClient.get<{ items: PlatformReport[] }>('/admin/reports');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    return [
      {
        reportId: 'rep_01',
        targetType: 'LISTING',
        targetId: 'listing_06',
        reason: 'Price clarification',
        description: 'Host stated SUV extra charge at the gate.',
        reportedBy: 'user_driver2',
        status: 'PENDING',
        createdAt: '2026-09-17T09:40:00.000Z'
      }
    ];
  },

  async resolveDispute(disputeId: string, resolution: string): Promise<boolean> {
    try {
      const res = await apiClient.patch<{ message: string }>(`/disputes/${disputeId}`, {
        status: 'RESOLVED',
        resolution
      });
      if (res.success) return true;
    } catch {
      // Fallback
    }
    return true;
  }
};
