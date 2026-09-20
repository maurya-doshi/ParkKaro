import { apiClient } from './client';
import { PlatformReport } from '../types/api';

export interface CreateReportInput {
  targetType: 'LISTING' | 'USER' | 'BOOKING' | 'MESSAGE';
  targetId: string;
  reason: string;
  description: string;
}

export const reportsApi = {
  /**
   * Create a platform report
   * POST /reports
   */
  async create(data: CreateReportInput): Promise<PlatformReport> {
    const res = await apiClient.post<PlatformReport>('/reports', data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to create report');
  },

  /**
   * List reports (Users see own reports, Admins see all)
   * GET /reports
   */
  async list(): Promise<PlatformReport[]> {
    const res = await apiClient.get<any>('/reports');
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  }
};
