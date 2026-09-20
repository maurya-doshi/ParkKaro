import { apiClient } from './client';
import { DriverDashboardStats } from '../types/api';

export const driverApi = {
  /**
   * Driver dashboard statistics and upcoming/active bookings
   * GET /driver/dashboard
   */
  async getDashboard(): Promise<DriverDashboardStats> {
    const res = await apiClient.get<DriverDashboardStats>('/driver/dashboard');
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to fetch driver dashboard');
  }
};
