import { apiClient } from './client';
import { AISearchRequest, AISearchResponse, AIPricingResponse } from '../types/ai';
import { ParkingListing } from '../types/parking';

export const aiApi = {
  /**
   * AI-assisted natural language search
   * POST /ai/search
   */
  async searchWithAssistant(req: AISearchRequest): Promise<AISearchResponse> {
    const res = await apiClient.post<AISearchResponse>('/ai/search', req);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('AI search request failed');
  },

  /**
   * Get dynamic pricing suggestions and market insights
   * POST /ai/pricing
   */
  async getPricingSuggestion(listingId: string, area?: string): Promise<AIPricingResponse> {
    const res = await apiClient.post<AIPricingResponse>('/ai/pricing', { listingId, area });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('AI pricing suggestion failed');
  },

  /**
   * Get personalized recommendations for user
   * POST /ai/recommend
   */
  async getRecommendations(userId: string = 'user_driver1', context?: string): Promise<ParkingListing[]> {
    const res = await apiClient.post<any>('/ai/recommend', { userId, context });
    if (res && res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data.listings)) return res.data.listings;
    }
    return [];
  },

  /**
   * Generate listing description context
   * POST /ai/listing-description
   */
  async generateListingDescription(params: {
    area: string;
    parkingType: string;
    amenities: string[];
    pricePerHour: number;
  }): Promise<any> {
    const res = await apiClient.post<any>('/ai/listing-description', params);
    if (res && res.data) {
      return res.data;
    }
    throw new Error('AI description generation failed');
  }
};
