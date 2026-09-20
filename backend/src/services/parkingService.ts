import { v4 as uuidv4 } from 'uuid';
import { parkingRepository } from '../repositories/parkingRepository';
import {
  ParkingListing,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
} from '../models/ParkingListing';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export class ParkingService {
  /**
   * Create a new parking listing.
   * Host ID is ALWAYS taken from the authenticated user token/session, never from client body.
   */
  async createListing(hostId: string, input: CreateListingInput): Promise<ParkingListing> {
    const timestamp = new Date().toISOString();
    const listingId = `listing_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

    const newListing: ParkingListing = {
      listingId,
      hostId,
      title: input.title,
      description: input.description,
      address: input.address,
      area: input.area,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      parkingType: input.parkingType,
      capacity: input.capacity,
      vehicleTypes: input.vehicleTypes,
      pricePerHour: input.pricePerHour,
      pricePerDay: input.pricePerDay,
      monthlyPrice: input.monthlyPrice,
      amenities: input.amenities || [],
      photos: input.photos || [],
      availability: input.availability || {},
      bookingSettings: input.bookingSettings,
      cancellationPolicy: input.cancellationPolicy || 'MODERATE',
      rating: 0,
      reviewCount: 0,
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return parkingRepository.create(newListing);
  }

  /**
   * Retrieve a listing by ID.
   * Throws PARKING_LISTING_NOT_FOUND (404) if not found or soft-deleted.
   */
  async getListingById(listingId: string): Promise<ParkingListing> {
    const listing = await parkingRepository.findById(listingId);

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundError('Parking listing', listingId);
    }

    return {
      ...listing,
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : (typeof listing.amenities === 'object' && listing.amenities
            ? (Object.keys(listing.amenities) as any)
            : []),
      vehicleTypes: Array.isArray(listing.vehicleTypes)
        ? listing.vehicleTypes
        : (typeof listing.vehicleTypes === 'object' && listing.vehicleTypes
            ? (Object.keys(listing.vehicleTypes) as any)
            : []),
      photos: Array.isArray(listing.photos) ? listing.photos : [],
      rating: typeof listing.rating === 'number' ? listing.rating : 0,
      reviewCount: typeof listing.reviewCount === 'number' ? listing.reviewCount : 0,
      capacity: listing.capacity || (listing as any).totalSlots || (listing as any).availableSlots || 1,
    };
  }

  /**
   * Update an existing listing.
   * Enforces ownership: only the owner host or an ADMIN can update.
   */
  async updateListing(
    listingId: string,
    userId: string,
    userRole: string,
    input: UpdateListingInput
  ): Promise<ParkingListing> {
    const existing = await this.getListingById(listingId);

    if (existing.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to modify this listing');
    }

    const updated = await parkingRepository.update(listingId, input);
    if (!updated) {
      throw new NotFoundError('Parking listing', listingId);
    }

    return updated;
  }

  /**
   * Soft-delete a listing (sets status to 'DELETED').
   * Enforces ownership: only the owner host or an ADMIN can delete.
   */
  async deleteListing(listingId: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.getListingById(listingId);

    if (existing.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this listing');
    }

    await parkingRepository.updateStatus(listingId, 'DELETED');
  }

  /**
   * Update listing status (ACTIVE, INACTIVE, SUSPENDED).
   * Host can toggle between ACTIVE and INACTIVE for their own listings.
   * Only ADMIN can set SUSPENDED.
   */
  async updateStatus(
    listingId: string,
    userId: string,
    userRole: string,
    status: ListingStatus
  ): Promise<ParkingListing> {
    const existing = await this.getListingById(listingId);

    if (existing.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this listing status');
    }

    if (status === 'SUSPENDED' && userRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can suspend a parking listing');
    }

    if (status === 'DELETED') {
      throw new ValidationError("Use DELETE endpoint to delete a listing");
    }

    const updated = await parkingRepository.updateStatus(listingId, status);
    if (!updated) {
      throw new NotFoundError('Parking listing', listingId);
    }

    return updated;
  }

  /**
   * List all listings owned by a specific host.
   */
  async getHostListings(hostId: string): Promise<ParkingListing[]> {
    const listings = await parkingRepository.findByHostId(hostId);
    return listings.filter((item) => item.status !== 'DELETED');
  }

  /**
   * List active listings with pagination limit.
   */
  async listActiveListings(limit = 20): Promise<{ items: ParkingListing[]; pagination: { count: number; limit: number; nextToken: null } }> {
    const items = await parkingRepository.listActive(limit);
    return {
      items,
      pagination: {
        count: items.length,
        limit,
        nextToken: null,
      },
    };
  }
}

export const parkingService = new ParkingService();
