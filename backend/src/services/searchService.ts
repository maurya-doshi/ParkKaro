import { parkingRepository } from '../repositories/parkingRepository';
import { ParkingListing, AmenityType, VehicleTypeEnum } from '../models/ParkingListing';
import { SearchParkingParams } from '../validators/searchValidator';
import { calculateHaversineDistance } from '../utils/geo';

export interface SearchListingItem {
  listingId: string;
  title: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  parkingType: string;
  pricePerHour: number;
  amenities: AmenityType[];
  rating: number;
  reviewCount: number;
  photos: string[];
  distance?: number;
}

export interface SearchResult {
  items: SearchListingItem[];
  pagination: {
    count: number;
    limit: number;
    nextToken: string | null;
  };
}

export class SearchService {
  /**
   * Search parking listings with comprehensive filtering and geo-distance calculations.
   */
  async search(params: SearchParkingParams): Promise<SearchResult> {
    let candidates: ParkingListing[] = [];

    // GSI Query selection
    if (params.hostId) {
      candidates = await parkingRepository.findByHostId(params.hostId);
    } else if (params.area) {
      candidates = await parkingRepository.findByArea(params.area, params.maxPrice);
    } else if (params.city) {
      candidates = await parkingRepository.findByCity(params.city);
    } else {
      candidates = await parkingRepository.listActive(100);
    }

    // Filter in-memory for secondary attributes & complex combinations
    let filtered = candidates.filter((item) => item.status === 'ACTIVE');

    if (params.area && !params.hostId) {
      const areaLower = params.area.toLowerCase();
      filtered = filtered.filter((item) => item.area.toLowerCase().includes(areaLower));
    }

    if (params.city && !params.hostId) {
      const cityLower = params.city.toLowerCase();
      filtered = filtered.filter((item) => item.city.toLowerCase() === cityLower);
    }

    if (params.minPrice !== undefined) {
      filtered = filtered.filter((item) => item.pricePerHour >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filtered = filtered.filter((item) => item.pricePerHour <= params.maxPrice!);
    }

    if (params.parkingType) {
      filtered = filtered.filter((item) => item.parkingType === params.parkingType);
    }

    if (params.vehicleType) {
      filtered = filtered.filter((item) =>
        item.vehicleTypes.includes(params.vehicleType as VehicleTypeEnum)
      );
    }

    if (params.rating !== undefined) {
      filtered = filtered.filter((item) => item.rating >= params.rating!);
    }

    if (params.amenities) {
      const requestedAmenities = params.amenities
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      filtered = filtered.filter((item) => {
        const itemAmenities = (item.amenities || []).map((a) => a.toLowerCase());
        return requestedAmenities.every((req) => itemAmenities.includes(req));
      });
    }

    // Date & Time operating hours filter
    if (params.date && params.startTime && params.endTime) {
      const dayOfWeek = this.getDayOfWeek(params.date);
      filtered = filtered.filter((item) => {
        const daySchedule = (item.availability as any)?.[dayOfWeek];
        if (!daySchedule || !daySchedule.open || !daySchedule.close) {
          return false;
        }
        return (
          params.startTime! >= daySchedule.open &&
          params.endTime! <= daySchedule.close
        );
      });
    }

    // Geo-distance calculation & radius filter
    const hasGeo = params.lat !== undefined && params.lng !== undefined;
    const radius = params.radius ?? 5;

    let itemsWithDistance: (SearchListingItem & { distance?: number })[] = filtered.map((listing) => {
      let distance: number | undefined;
      if (hasGeo) {
        distance = calculateHaversineDistance(
          params.lat!,
          params.lng!,
          listing.latitude,
          listing.longitude
        );
      }

      return {
        listingId: listing.listingId,
        title: listing.title,
        area: listing.area,
        city: listing.city,
        latitude: listing.latitude,
        longitude: listing.longitude,
        parkingType: listing.parkingType,
        pricePerHour: listing.pricePerHour,
        amenities: listing.amenities,
        rating: listing.rating,
        reviewCount: listing.reviewCount,
        photos: listing.photos,
        ...(distance !== undefined ? { distance } : {}),
      };
    });

    if (hasGeo) {
      itemsWithDistance = itemsWithDistance.filter(
        (item) => item.distance !== undefined && item.distance <= radius
      );
    }

    // Sorting
    if (params.sortBy === 'price') {
      itemsWithDistance.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (params.sortBy === 'rating') {
      itemsWithDistance.sort((a, b) => b.rating - a.rating);
    } else if (params.sortBy === 'distance' && hasGeo) {
      itemsWithDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    // Pagination
    const limit = params.limit || 20;
    const paginatedItems = itemsWithDistance.slice(0, limit);

    return {
      items: paginatedItems,
      pagination: {
        count: paginatedItems.length,
        limit,
        nextToken: null,
      },
    };
  }

  private getDayOfWeek(dateStr: string): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return days[d.getUTCDay()];
  }
}

export const searchService = new SearchService();
