import { apiClient } from './client';
import { AISearchRequest, AISearchResponse, AIPricingResponse } from '../types/ai';
import { parkingApi } from './parking';
import { ParkingListing } from '../types/parking';

export const aiApi = {
  async searchWithAssistant(req: AISearchRequest): Promise<AISearchResponse> {
    try {
      const res = await apiClient.post<AISearchResponse>('/ai/search', req);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback AI simulation
    }

    const query = req.query.toLowerCase();
    const { items: allListings } = await parkingApi.search();

    let matched = allListings;
    let explanation = 'I found the best parking spots matching your request.';

    if (query.includes('koramangala')) {
      matched = allListings.filter((l) => l.area.toLowerCase().includes('koramangala'));
      explanation = 'Found high-demand secure spots right in Koramangala with fast access.';
    } else if (query.includes('indiranagar')) {
      matched = allListings.filter((l) => l.area.toLowerCase().includes('indiranagar'));
      explanation = 'Filtered verified bays near 100ft road Indiranagar.';
    } else if (query.includes('whitefield') || query.includes('itpl')) {
      matched = allListings.filter((l) => l.area.toLowerCase().includes('whitefield'));
      explanation = 'Found IT corridor parking spots around Whitefield / ITPL with EV support.';
    } else if (query.includes('ev') || query.includes('electric') || query.includes('charging')) {
      matched = allListings.filter((l) => l.amenities.includes('evCharging') || l.vehicleTypes.includes('EV'));
      explanation = 'Identified premium spots equipped with verified EV charging infrastructure.';
    } else if (query.includes('cheap') || query.includes('budget') || query.includes('under 40') || query.includes('under 50')) {
      matched = allListings.filter((l) => l.pricePerHour <= 45);
      explanation = 'Sorted budget-friendly verified parking options under ₹45/hr.';
    } else if (query.includes('covered') || query.includes('basement') || query.includes('rain')) {
      matched = allListings.filter((l) => l.parkingType === 'COVERED' || l.parkingType === 'BASEMENT');
      explanation = 'Selected weather-proof covered spots with CCTV surveillance.';
    }

    return {
      listings: matched.slice(0, 4),
      searchContext: {
        resultsCount: matched.length,
        filtersApplied: {
          query: req.query
        }
      },
      explanation
    };
  },

  async getPricingSuggestion(listingId: string, area: string = 'Koramangala'): Promise<AIPricingResponse> {
    try {
      const res = await apiClient.post<AIPricingResponse>('/ai/pricing', { listingId });
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    return {
      listing: { listingId, area },
      comparables: [
        { title: 'Nexus Mall Proximity Covered Bay', area: 'Koramangala', pricePerHour: 45, occupancyRate: 0.88 },
        { title: 'Forum Mall Adjacent Driveway', area: 'Koramangala', pricePerHour: 50, occupancyRate: 0.82 }
      ],
      areaAveragePrice: 48,
      bookingDemand: 'HIGH',
      suggestedHourlyPrice: 50,
      suggestedDailyPrice: 420,
      suggestion: 'ESTIMATE',
      insight: `Demand in ${area} surges on weekends and evenings by 35%. A price point of ₹50/hr optimizes both occupancy and weekly gross revenue.`
    };
  },

  async getRecommendations(userId: string = 'user_driver1'): Promise<ParkingListing[]> {
    try {
      const res = await apiClient.post<{ items: ParkingListing[] }>('/ai/recommend', { userId });
      if (res.success && res.data?.items) return res.data.items;
    } catch {
      // Fallback
    }

    const { items } = await parkingApi.search();
    // Return top rated listings with high amenities
    return items.filter((l) => l.rating >= 4.8).slice(0, 3);
  }
};
