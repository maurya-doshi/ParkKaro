/**
 * ParkingListing model — corresponds to parkshare-parking table.
 */

export type ParkingType = 'OPEN' | 'COVERED' | 'BASEMENT' | 'GARAGE' | 'PRIVATE' | 'COMMERCIAL';
export type VehicleTypeEnum = 'CAR' | 'BIKE' | 'SUV' | 'TRUCK' | 'EV';
export type AmenityType = 'covered' | 'cctv' | 'security' | 'lighting' | 'evCharging' | 'accessible' | '24x7';
export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | 'AVAILABLE';

export interface DayAvailability {
  open: string; // HH:mm
  close: string; // HH:mm
}

export interface WeeklyAvailability {
  monday?: DayAvailability;
  tuesday?: DayAvailability;
  wednesday?: DayAvailability;
  thursday?: DayAvailability;
  friday?: DayAvailability;
  saturday?: DayAvailability;
  sunday?: DayAvailability;
}

export interface BookingSettings {
  minDurationHours?: number;
  maxDurationHours?: number;
  advanceBookingDays?: number;
  instantBooking?: boolean;
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
  vehicleTypes: VehicleTypeEnum[];
  pricePerHour: number;
  pricePerDay?: number;
  monthlyPrice?: number;
  amenities: AmenityType[];
  photos: string[];
  availability: WeeklyAvailability;
  bookingSettings?: BookingSettings;
  cancellationPolicy: CancellationPolicy;
  rating: number;
  reviewCount: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  title: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  parkingType: ParkingType;
  capacity: number;
  vehicleTypes: VehicleTypeEnum[];
  pricePerHour: number;
  pricePerDay?: number;
  monthlyPrice?: number;
  amenities: AmenityType[];
  photos?: string[];
  availability: WeeklyAvailability;
  bookingSettings?: BookingSettings;
  cancellationPolicy?: CancellationPolicy;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  parkingType?: ParkingType;
  capacity?: number;
  vehicleTypes?: VehicleTypeEnum[];
  pricePerHour?: number;
  pricePerDay?: number;
  monthlyPrice?: number;
  amenities?: AmenityType[];
  photos?: string[];
  availability?: WeeklyAvailability;
  bookingSettings?: BookingSettings;
  cancellationPolicy?: CancellationPolicy;
}

export interface ListingSearchParams {
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
  parkingType?: ParkingType;
  vehicleType?: VehicleTypeEnum;
  amenities?: AmenityType[];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'distance';
  limit?: number;
  nextToken?: string;
}
