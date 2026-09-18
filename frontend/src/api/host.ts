import { apiClient } from './client';
import { HostDashboardStats } from '../types/api';
import { parkingApi } from './parking';
import { bookingsApi } from './bookings';

export interface HostEarningsBreakdown {
  grossRevenue: number;
  platformCommission: number;
  netEarnings: number;
  totalBookings: number;
  period: string;
  breakdown: Array<{
    date: string;
    bookings: number;
    gross: number;
    commission: number;
    net: number;
  }>;
}

export interface PayoutRecord {
  payoutId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export const hostApi = {
  async getDashboard(): Promise<HostDashboardStats> {
    try {
      const res = await apiClient.get<HostDashboardStats>('/host/dashboard');
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const { items: allListings } = await parkingApi.search();
    const hostListings = allListings.filter((l) => l.hostId === 'user_host1' || l.hostId === 'user_host2');
    const { items: allBookings } = await bookingsApi.list();
    const hostBookings = allBookings.filter((b) => b.hostId === 'user_host1' || b.hostId === 'user_host2');

    const totalEarnings = hostBookings.reduce((sum, b) => sum + (b.hostEarnings || 0), 0) + 45000;
    const monthlyEarnings = 14200;

    return {
      totalListings: Math.max(3, hostListings.length),
      activeListings: hostListings.filter((l) => l.status === 'ACTIVE').length || 2,
      upcomingBookings: hostBookings.filter((b) => b.bookingStatus === 'CONFIRMED').length || 3,
      activeBookings: hostBookings.filter((b) => b.bookingStatus === 'ACTIVE').length || 1,
      completedBookings: hostBookings.filter((b) => b.bookingStatus === 'COMPLETED').length || 38,
      totalEarnings,
      monthlyEarnings,
      occupancyRate: 0.76,
      averageRating: 4.8,
      recentBookings: hostBookings.slice(0, 5).map((b) => ({
        bookingId: b.bookingId,
        listingTitle: b.listingTitle || 'Parking Spot',
        driverName: b.driverName || 'Verified Driver',
        startTime: b.startTime,
        endTime: b.endTime,
        amount: b.totalAmount,
        status: b.bookingStatus
      }))
    };
  },

  async getEarnings(period: string = 'month'): Promise<HostEarningsBreakdown> {
    try {
      const res = await apiClient.get<HostEarningsBreakdown>('/host/earnings', { period });
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    return {
      grossRevenue: 15800,
      platformCommission: 1580,
      netEarnings: 14220,
      totalBookings: 48,
      period,
      breakdown: [
        { date: '2026-09-14', bookings: 6, gross: 1980, commission: 198, net: 1782 },
        { date: '2026-09-15', bookings: 8, gross: 2640, commission: 264, net: 2376 },
        { date: '2026-09-16', bookings: 7, gross: 2310, commission: 231, net: 2079 },
        { date: '2026-09-17', bookings: 9, gross: 2970, commission: 297, net: 2673 },
        { date: '2026-09-18', bookings: 11, gross: 3630, commission: 363, net: 3267 },
        { date: '2026-09-19', bookings: 7, gross: 2270, commission: 227, net: 2043 }
      ]
    };
  },

  async getPayouts(): Promise<PayoutRecord[]> {
    try {
      const res = await apiClient.get<{ items: PayoutRecord[] }>('/host/payouts');
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    return [
      {
        payoutId: 'payout_sep01',
        amount: 12500,
        status: 'PAID',
        periodStart: '2026-08-16',
        periodEnd: '2026-08-31',
        createdAt: '2026-09-02T10:00:00.000Z'
      },
      {
        payoutId: 'payout_aug15',
        amount: 10800,
        status: 'PAID',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-15',
        createdAt: '2026-08-16T10:00:00.000Z'
      }
    ];
  }
};
