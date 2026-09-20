import { ParkingListing } from './parking';

export interface AISearchRequest {
  query: string;
  filters?: {
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    parkingType?: string;
    maxBudget?: number;
  };
}

export interface AISearchResponse {
  listings: ParkingListing[];
  searchContext: {
    area?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    resultsCount: number;
    filtersApplied: Record<string, unknown>;
  };
  explanation?: string;
}

export interface AIPricingResponse {
  listing: Partial<ParkingListing>;
  comparables: Array<{
    title: string;
    area: string;
    pricePerHour: number;
    occupancyRate: number;
  }>;
  areaAveragePrice: number;
  bookingDemand: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedHourlyPrice: number;
  suggestedDailyPrice: number;
  suggestion: 'ESTIMATE';
  insight: string;
}
