import { apiClient } from './client';
import { Dispute } from '../types/api';

export interface CreateDisputeInput {
  bookingId: string;
  reason: string;
  description: string;
  evidence?: string[];
}

export interface ResolveDisputeInput {
  status: 'RESOLVED' | 'DISMISSED';
  resolution: string;
}

export const disputesApi = {
  /**
   * Create a dispute for a booking (DRIVER / HOST)
   * POST /disputes
   */
  async create(data: CreateDisputeInput): Promise<Dispute> {
    const res = await apiClient.post<Dispute>('/disputes', data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to create dispute');
  },

  /**
   * List user's disputes
   * GET /disputes
   */
  async list(): Promise<Dispute[]> {
    const res = await apiClient.get<any>('/disputes');
    if (res && res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  /**
   * Get dispute by ID
   * GET /disputes/{id}
   */
  async getById(id: string): Promise<Dispute> {
    const res = await apiClient.get<Dispute>(`/disputes/${id}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Dispute '${id}' not found`);
  },

  /**
   * Update / resolve dispute (ADMIN)
   * PATCH /disputes/{id}
   */
  async resolve(id: string, data: ResolveDisputeInput): Promise<Dispute> {
    const res = await apiClient.patch<Dispute>(`/disputes/${id}`, data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to update dispute '${id}'`);
  }
};
