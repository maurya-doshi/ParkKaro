import { apiClient } from './client';
import {
  ParkingListing,
  ParkingSearchFilters,
  AvailabilityCheckResponse
} from '../types/parking';
import { PaginatedData, ApiResponse } from '../types/api';
import { DEMO_LISTINGS } from './mockData';

// Local storage key for demo mutations
const MOCK_STORAGE_KEY = 'parkshare_demo_listings';

function getStoredListings(): ParkingListing[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock listings', e);
  }
  return [...DEMO_LISTINGS];
}

function saveStoredListings(listings: ParkingListing[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(listings));
  } catch (e) {
    console.error('Error saving mock listings', e);
  }
}

export const parkingApi = {
  async search(filters: ParkingSearchFilters = {}): Promise<PaginatedData<ParkingListing>> {
    try {
      const res = await apiClient.get<PaginatedData<ParkingListing>>('/parking', {
        area: filters.area,
        city: filters.city,
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        date: filters.date,
        startTime: filters.startTime,
        endTime: filters.endTime,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        parkingType: filters.parkingType,
        vehicleType: filters.vehicleType,
        amenities: filters.amenities,
        rating: filters.rating,
        sortBy: filters.sortBy,
        limit: filters.limit || 20
      });
      if (res.success && res.data?.items) {
        return res.data;
      }
    } catch {
      // Graceful fallback to mock data
    }

    let listings = getStoredListings().filter((l) => l.status === 'ACTIVE');

    if (filters.area) {
      const q = filters.area.toLowerCase().trim();
      listings = listings.filter(
        (l) => l.area.toLowerCase().includes(q) || l.title.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
      );
    }

    if (filters.parkingType) {
      listings = listings.filter((l) => l.parkingType === filters.parkingType);
    }

    if (filters.vehicleType) {
      const vType = filters.vehicleType;
      listings = listings.filter((l) => l.vehicleTypes.includes(vType));
    }

    if (filters.minPrice !== undefined) {
      listings = listings.filter((l) => l.pricePerHour >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      listings = listings.filter((l) => l.pricePerHour <= filters.maxPrice!);
    }

    if (filters.rating) {
      listings = listings.filter((l) => l.rating >= filters.rating!);
    }

    if (filters.amenities) {
      const required = filters.amenities.split(',').map((a) => a.trim().toLowerCase());
      listings = listings.filter((l) => required.every((req) => l.amenities.map(x => x.toLowerCase()).includes(req)));
    }

    if (filters.sortBy === 'price') {
      listings.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (filters.sortBy === 'rating') {
      listings.sort((a, b) => b.rating - a.rating);
    }

    return {
      items: listings,
      pagination: {
        count: listings.length,
        total: listings.length,
        nextToken: null,
        limit: filters.limit || 20
      }
    };
  },

  async getById(id: string): Promise<ParkingListing> {
    try {
      const res = await apiClient.get<ParkingListing>(`/parking/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const listing = getStoredListings().find((l) => l.listingId === id);
    if (!listing) {
      throw new Error(`Parking listing '${id}' not found`);
    }
    return listing;
  },

  async checkAvailability(id: string, date: string, startTime?: string, endTime?: string): Promise<AvailabilityCheckResponse> {
    try {
      const res = await apiClient.get<AvailabilityCheckResponse>(`/parking/${id}/availability`, {
        date,
        startTime,
        endTime
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const listing = await this.getById(id);
    const ratePerHour = listing.pricePerHour;
    const startHour = startTime ? parseInt(startTime.split(':')[0]) : 10;
    const endHour = endTime ? parseInt(endTime.split(':')[0]) : 12;
    const durationHours = Math.max(1, endHour - startHour);
    const baseAmount = ratePerHour * durationHours;
    const platformFee = Math.round(baseAmount * 0.1);
    const totalAmount = baseAmount + platformFee;

    const slots = [
      { time: '06:00', available: listing.capacity },
      { time: '07:00', available: listing.capacity },
      { time: '08:00', available: listing.capacity - 1 },
      { time: '09:00', available: listing.capacity - 1 },
      { time: '10:00', available: listing.capacity },
      { time: '11:00', available: listing.capacity },
      { time: '12:00', available: listing.capacity },
      { time: '13:00', available: listing.capacity },
      { time: '14:00', available: listing.capacity },
      { time: '15:00', available: listing.capacity },
      { time: '16:00', available: listing.capacity },
      { time: '17:00', available: listing.capacity - 1 },
      { time: '18:00', available: listing.capacity - 1 },
      { time: '19:00', available: listing.capacity },
      { time: '20:00', available: listing.capacity },
      { time: '21:00', available: listing.capacity }
    ];

    return {
      listingId: id,
      date,
      capacity: listing.capacity,
      operatingHours: { open: '06:00', close: '23:00' },
      slots,
      requestedRange: {
        startTime: startTime || '10:00',
        endTime: endTime || '12:00',
        isAvailable: true,
        availableSpaces: Math.max(1, listing.capacity - 1)
      },
      priceEstimate: {
        baseAmount,
        platformFee,
        tax: 0,
        totalAmount,
        durationHours,
        ratePerHour
      }
    };
  },

  async create(data: Partial<ParkingListing>): Promise<ParkingListing> {
    try {
      const res = await apiClient.post<ParkingListing>('/parking', data);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const current = getStoredListings();
    const newListing: ParkingListing = {
      listingId: `listing_${Date.now()}`,
      hostId: data.hostId || 'user_host1',
      title: data.title || 'New Parking Space',
      description: data.description || '',
      address: data.address || 'Bengaluru',
      area: data.area || 'Koramangala',
      city: 'Bengaluru',
      latitude: data.latitude || 12.9352,
      longitude: data.longitude || 77.6245,
      parkingType: data.parkingType || 'COVERED',
      capacity: data.capacity || 2,
      vehicleTypes: data.vehicleTypes || ['CAR', 'SUV'],
      pricePerHour: data.pricePerHour || 40,
      pricePerDay: data.pricePerDay || (data.pricePerHour ? data.pricePerHour * 8 : 320),
      monthlyPrice: data.monthlyPrice,
      amenities: data.amenities || ['covered', 'cctv'],
      photos: data.photos && data.photos.length > 0 ? data.photos : ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'],
      availability: data.availability || {
        monday: { open: '06:00', close: '23:00' },
        tuesday: { open: '06:00', close: '23:00' },
        wednesday: { open: '06:00', close: '23:00' },
        thursday: { open: '06:00', close: '23:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '08:00', close: '22:00' },
        sunday: { open: '08:00', close: '22:00' }
      },
      cancellationPolicy: data.cancellationPolicy || 'MODERATE',
      rating: 5.0,
      reviewCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newListing, ...current];
    saveStoredListings(updated);
    return newListing;
  },

  async update(id: string, data: Partial<ParkingListing>): Promise<ParkingListing> {
    try {
      const res = await apiClient.put<ParkingListing>(`/parking/${id}`, data);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const current = getStoredListings();
    const index = current.findIndex((l) => l.listingId === id);
    if (index === -1) throw new Error('Listing not found');

    const updated = {
      ...current[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    current[index] = updated;
    saveStoredListings(current);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiClient.delete<{ message: string }>(`/parking/${id}`);
      if (res.success) return true;
    } catch {
      // Fallback
    }

    const current = getStoredListings();
    const updated = current.map((l) => (l.listingId === id ? { ...l, status: 'DELETED' as const } : l));
    saveStoredListings(updated);
    return true;
  }
};
