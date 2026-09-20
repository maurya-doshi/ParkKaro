export type ParkingType = 'OPEN' | 'COVERED' | 'BASEMENT' | 'GARAGE' | 'PRIVATE' | 'COMMERCIAL';

export type VehicleType = 'CAR' | 'BIKE' | 'SUV' | 'TRUCK' | 'EV';

export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export interface DayAvailability {
  open: string;  // e.g. "06:00"
  close: string; // e.g. "23:00"
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface ParkingListing {
  listingId: string;
  hostId: string;
  title: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  parkingType: ParkingType;
  capacity: number;
  vehicleTypes: VehicleType[];
  pricePerHour: number;
  pricePerDay?: number;
  monthlyPrice?: number;
  amenities: string[];
  photos: string[];
  availability: WeeklyAvailability;
  cancellationPolicy: CancellationPolicy;
  rating: number;
  reviewCount: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  distance?: number; // Calculated dynamically in search
}

export interface ParkingSearchFilters {
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  minPrice?: number;
  maxPrice?: number;
  parkingType?: ParkingType | '';
  vehicleType?: VehicleType | '';
  amenities?: string;
  rating?: number;
  sortBy?: 'price' | 'rating' | 'distance';
  limit?: number;
  nextToken?: string | null;
}

export interface SlotAvailability {
  time: string;
  available: number;
}

export interface AvailabilityCheckResponse {
  listingId: string;
  date: string;
  capacity: number;
  operatingHours: { open: string; close: string };
  slots: SlotAvailability[];
  requestedRange: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    availableSpaces: number;
  };
  priceEstimate: {
    baseAmount: number;
    platformFee: number;
    tax: number;
    totalAmount: number;
    durationHours: number;
    ratePerHour: number;
  };
}
