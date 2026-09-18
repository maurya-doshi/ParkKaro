import { parkingRepository } from '../repositories/parkingRepository';
import { slotLockRepository } from '../repositories/slotLockRepository';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AvailabilityQueryParams } from '../validators/availabilityValidator';
import { generateOperatingSlots, getTimeSlotsForRange, timeToSlotIndex } from '../utils/slots';
import { calculatePrice, PriceBreakdown } from '../utils/pricing';

export interface SlotAvailability {
  time: string;
  available: number;
}

export interface RequestedRangeAvailability {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  availableSpaces: number;
}

export interface AvailabilityResult {
  listingId: string;
  date: string;
  capacity: number;
  operatingHours: { open: string; close: string } | null;
  slots: SlotAvailability[];
  requestedRange?: RequestedRangeAvailability;
  priceEstimate?: PriceBreakdown;
}

export class AvailabilityService {
  /**
   * Check real-time slot availability and calculate price estimates for a listing.
   */
  async checkAvailability(
    listingId: string,
    params: AvailabilityQueryParams
  ): Promise<AvailabilityResult> {
    const listing = await parkingRepository.findById(listingId);

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundError('Parking listing', listingId);
    }

    const dayOfWeek = this.getDayOfWeek(params.date);
    const operatingHours = (listing.availability as any)?.[dayOfWeek];

    // If listing is closed on the requested date
    if (!operatingHours || !operatingHours.open || !operatingHours.close) {
      return {
        listingId,
        date: params.date,
        capacity: listing.capacity,
        operatingHours: null,
        slots: [],
        ...(params.startTime && params.endTime
          ? {
              requestedRange: {
                startTime: params.startTime,
                endTime: params.endTime,
                isAvailable: false,
                availableSpaces: 0,
              },
            }
          : {}),
      };
    }

    // Query active slot-locks for this listing on this date
    const locks = await slotLockRepository.getLocksForListingAndDate(listingId, params.date);
    const activeLocks = locks.filter((l) => l.status === 'BOOKED');

    // Tally booked spaces per slot index
    const bookedPerSlotIndex: Record<number, number> = {};
    for (const lock of activeLocks) {
      const parts = lock.slotKey.split('#');
      const idx = parseInt(parts[1], 10);
      if (!isNaN(idx)) {
        bookedPerSlotIndex[idx] = (bookedPerSlotIndex[idx] || 0) + 1;
      }
    }

    // Generate all operating slots for the day
    const allOperatingSlots = generateOperatingSlots(
      params.date,
      operatingHours.open,
      operatingHours.close
    );

    const slots: SlotAvailability[] = allOperatingSlots.map((s) => ({
      time: s.time,
      available: Math.max(0, listing.capacity - (bookedPerSlotIndex[s.slotIndex] || 0)),
    }));

    let requestedRange: RequestedRangeAvailability | undefined;
    let priceEstimate: PriceBreakdown | undefined;

    if (params.startTime && params.endTime) {
      if (params.startTime >= params.endTime) {
        throw new ValidationError('End time must be after start time');
      }

      const openIdx = timeToSlotIndex(operatingHours.open);
      const closeIdx = timeToSlotIndex(operatingHours.close);
      const reqStartIdx = timeToSlotIndex(params.startTime);
      const reqEndIdx = timeToSlotIndex(params.endTime);

      const withinHours = reqStartIdx >= openIdx && reqEndIdx <= closeIdx;

      const requestedSlots = getTimeSlotsForRange(params.date, params.startTime, params.endTime);
      let minAvailable = listing.capacity;

      for (const slot of requestedSlots) {
        const availableInSlot = Math.max(
          0,
          listing.capacity - (bookedPerSlotIndex[slot.slotIndex] || 0)
        );
        if (availableInSlot < minAvailable) {
          minAvailable = availableInSlot;
        }
      }

      const isAvailable = withinHours && minAvailable > 0;

      requestedRange = {
        startTime: params.startTime,
        endTime: params.endTime,
        isAvailable,
        availableSpaces: isAvailable ? minAvailable : 0,
      };

      const startIso = `${params.date}T${params.startTime}:00.000Z`;
      const endIso = `${params.date}T${params.endTime}:00.000Z`;
      priceEstimate = calculatePrice(listing.pricePerHour, startIso, endIso);
    }

    return {
      listingId,
      date: params.date,
      capacity: listing.capacity,
      operatingHours: { open: operatingHours.open, close: operatingHours.close },
      slots,
      ...(requestedRange ? { requestedRange } : {}),
      ...(priceEstimate ? { priceEstimate } : {}),
    };
  }

  private getDayOfWeek(dateStr: string): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return days[d.getUTCDay()];
  }
}

export const availabilityService = new AvailabilityService();
