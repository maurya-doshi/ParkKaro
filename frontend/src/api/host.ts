import { apiClient } from './client';
import { HostDashboardStats } from '../types/api';

export interface HostEarningsBreakdown {
  grossRevenue: number;
  platformFees: number;
  netEarnings: number;
  totalBookings: number;
  period: string;
  breakdown: Array<{
    date: string;
    bookings: number;
    gross: number;
    fees: number;
    net: number;
  }>;
}

export interface PayoutRecord {
  payoutId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  period: string;
  currency: string;
  createdAt: string;
}

export const hostApi = {
  /**
   * Host dashboard metrics and recent bookings
   * GET /host/dashboard
   */
  async getDashboard(): Promise<HostDashboardStats> {
    const res = await apiClient.get<HostDashboardStats>('/host/dashboard');
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch host dashboard stats');
  },

  /**
   * Host earnings summary and daily breakdown
   * GET /host/earnings
   */
  async getEarnings(period: string = 'month'): Promise<HostEarningsBreakdown> {
    const res = await apiClient.get<HostEarningsBreakdown>('/host/earnings', { period });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch host earnings');
  },

  /**
   * Host payouts history
   * GET /host/payouts
   */
  async getPayouts(): Promise<PayoutRecord[]> {
    const res = await apiClient.get<any>('/host/payouts');
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  }
};
