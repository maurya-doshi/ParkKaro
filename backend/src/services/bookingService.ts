import { v4 as uuidv4 } from 'uuid';
import { bookingRepository } from '../repositories/bookingRepository';
import { parkingRepository } from '../repositories/parkingRepository';
import { slotLockRepository } from '../repositories/slotLockRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { Booking, BookingStatus } from '../models/Booking';
import { SlotLock } from '../models/SlotLock';
import { CreateBookingParams, CancelBookingParams } from '../validators/bookingValidator';
import { NotFoundError, ForbiddenError, ValidationError, BookingConflictError } from '../utils/errors';
import { calculatePrice } from '../utils/pricing';
import { generateQRData } from '../utils/qr';
import { getTimeSlotsForRange, timeToSlotIndex } from '../utils/slots';

export class BookingService {
  /**
   * Create a new booking with strict atomic slot locking and double-booking prevention.
   */
  async createBooking(driverId: string, input: CreateBookingParams): Promise<Booking> {
    if (input.startTime >= input.endTime) {
      throw new ValidationError('End time must be after start time');
    }

    const listing = await parkingRepository.findById(input.listingId);
    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundError('Parking listing', input.listingId);
    }
    if (listing.status !== 'ACTIVE') {
      throw new ValidationError('Parking listing is currently inactive');
    }

    // Verify operating hours
    const dayOfWeek = this.getDayOfWeek(input.date);
    const operatingHours = (listing.availability as any)?.[dayOfWeek];
    if (!operatingHours || !operatingHours.open || !operatingHours.close) {
      throw new ValidationError(`Parking listing is closed on ${dayOfWeek}s`);
    }

    const openIdx = timeToSlotIndex(operatingHours.open);
    const closeIdx = timeToSlotIndex(operatingHours.close);
    const reqStartIdx = timeToSlotIndex(input.startTime);
    const reqEndIdx = timeToSlotIndex(input.endTime);

    if (reqStartIdx < openIdx || reqEndIdx > closeIdx) {
      throw new ValidationError(
        `Requested time is outside operating hours (${operatingHours.open} - ${operatingHours.close})`
      );
    }

    const startIso = `${input.date}T${input.startTime}:00.000Z`;
    const endIso = `${input.date}T${input.endTime}:00.000Z`;

    // Calculate price breakdown
    const pricing = calculatePrice(listing.pricePerHour, startIso, endIso);
    const hostEarnings = Math.max(0, pricing.baseAmount - pricing.platformFee);

    const bookingId = `booking_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    // Query active locks to assign an available space index (space1 ... spaceN)
    const existingLocks = await slotLockRepository.getLocksForListingAndDate(
      input.listingId,
      input.date
    );
    const activeLocks = existingLocks.filter((l) => l.status === 'BOOKED');
    const requestedSlots = getTimeSlotsForRange(input.date, input.startTime, input.endTime);

    let assignedSpaceIndex = -1;
    for (let s = 1; s <= listing.capacity; s++) {
      const spaceSuffix = `#space${s}`;
      const hasConflict = requestedSlots.some((slot) => {
        const fullKey = `${slot.slotKey}${spaceSuffix}`;
        return activeLocks.some((l) => l.slotKey === fullKey || l.slotKey === slot.slotKey);
      });

      if (!hasConflict) {
        assignedSpaceIndex = s;
        break;
      }
    }

    if (assignedSpaceIndex === -1) {
      throw new BookingConflictError('The requested time slot is no longer available');
    }

    // Generate atomic slot locks for the assigned space
    const locksToAcquire: SlotLock[] = requestedSlots.map((slot) => ({
      listingId: input.listingId,
      slotKey: `${slot.slotKey}#space${assignedSpaceIndex}`,
      bookingId,
      driverId,
      startTime: startIso,
      endTime: endIso,
      status: 'BOOKED',
      createdAt: timestamp,
    }));

    // Atomically acquire slot locks in DynamoDB
    const acquired = await slotLockRepository.acquireLocks(locksToAcquire);
    if (!acquired) {
      throw new BookingConflictError('The requested time slot is no longer available');
    }

    // Generate QR verification data
    const qrResult = generateQRData({
      bookingId,
      listingId: input.listingId,
      driverId,
      startTime: startIso,
      endTime: endIso,
    });

    const newBooking: Booking = {
      bookingId,
      listingId: input.listingId,
      hostId: listing.hostId,
      driverId,
      vehicleId: input.vehicleId,
      startTime: startIso,
      endTime: endIso,
      durationHours: pricing.durationHours,
      baseAmount: pricing.baseAmount,
      platformFee: pricing.platformFee,
      tax: pricing.tax,
      totalAmount: pricing.totalAmount,
      hostEarnings,
      paymentStatus: 'PENDING',
      bookingStatus: 'CONFIRMED',
      qrData: qrResult.encoded,
      qrVerificationCode: qrResult.payload.verificationCode,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await bookingRepository.create(newBooking);

    // Create payment record
    const paymentId = `pay_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    await paymentRepository.create({
      paymentId,
      bookingId,
      userId: driverId,
      amount: pricing.totalAmount,
      currency: 'INR',
      status: 'PENDING',
      provider: 'MOCK',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // In-app notifications
    await Promise.all([
      notificationRepository.create({
        userId: driverId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed!',
        message: `Your parking reservation at ${listing.title} on ${input.date} (${input.startTime} - ${input.endTime}) is confirmed.`,
        data: { bookingId, listingId: input.listingId },
      }),
      notificationRepository.create({
        userId: listing.hostId,
        type: 'NEW_HOST_BOOKING',
        title: 'New Booking Received',
        message: `A driver reserved a space at ${listing.title} for ${input.date} (${input.startTime} - ${input.endTime}).`,
        data: { bookingId, listingId: input.listingId },
      }),
    ]);

    return newBooking;
  }

  /**
   * Get a booking by ID with ownership/access control.
   */
  async getBookingById(bookingId: string, userId: string, userRole: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.driverId !== userId && booking.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }

  /**
   * List bookings for the authenticated user (driver or host).
   */
  async listUserBookings(
    userId: string,
    userRole: string,
    status?: BookingStatus,
    limit = 20
  ): Promise<{ items: Booking[]; pagination: { count: number; limit: number; nextToken: null } }> {
    let bookings: Booking[] = [];

    if (userRole === 'HOST') {
      bookings = await bookingRepository.findByHostId(userId);
    } else {
      bookings = await bookingRepository.findByDriverId(userId);
    }

    if (status) {
      bookings = bookings.filter((b) => b.bookingStatus === status);
    }

    bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const paginated = bookings.slice(0, limit);

    return {
      items: paginated,
      pagination: {
        count: paginated.length,
        limit,
        nextToken: null,
      },
    };
  }

  /**
   * Cancel a booking, release reserved slot locks, and update statuses.
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    userRole: string,
    input?: CancelBookingParams
  ): Promise<{
    bookingId: string;
    bookingStatus: string;
    paymentStatus: string;
    cancellationReason?: string;
    cancelledBy: string;
    cancelledAt: string;
    refundAmount: number;
  }> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.driverId !== userId && booking.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
      throw new ValidationError(`Cannot cancel a booking in ${booking.bookingStatus} status`);
    }

    const timestamp = new Date().toISOString();
    const reason = input?.reason || 'Cancelled by user';

    // Release slot locks
    const date = booking.startTime.substring(0, 10);
    const startHourMin = booking.startTime.substring(11, 16);
    const endHourMin = booking.endTime.substring(11, 16);
    const slots = getTimeSlotsForRange(date, startHourMin, endHourMin);
    const slotKeysToRelease: string[] = [];

    const existingLocks = await slotLockRepository.getLocksForListingAndDate(booking.listingId, date);
    for (const lock of existingLocks) {
      if (lock.bookingId === bookingId) {
        slotKeysToRelease.push(lock.slotKey);
      }
    }
    if (slotKeysToRelease.length === 0) {
      slotKeysToRelease.push(...slots.map((s) => s.slotKey));
    }

    await slotLockRepository.releaseLocks(booking.listingId, slotKeysToRelease);

    await bookingRepository.updateStatus(bookingId, 'CANCELLED', {
      reason,
      cancelledBy: userId,
      cancelledAt: timestamp,
    });

    await bookingRepository.updatePaymentStatus(bookingId, 'REFUNDED');

    // Notify other party
    const targetUserId = userId === booking.driverId ? booking.hostId : booking.driverId;
    await notificationRepository.create({
      userId: targetUserId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Booking ${bookingId} was cancelled. Reason: ${reason}`,
      data: { bookingId },
    });

    return {
      bookingId,
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancellationReason: reason,
      cancelledBy: userId,
      cancelledAt: timestamp,
      refundAmount: booking.totalAmount,
    };
  }

  /**
   * Complete a booking.
   */
  async completeBooking(bookingId: string, userId: string, userRole: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Only the host or admin can complete this booking');
    }

    const updated = await bookingRepository.updateStatus(bookingId, 'COMPLETED');
    if (!updated) {
      throw new NotFoundError('Booking', bookingId);
    }
    return updated;
  }

  /**
   * Verify QR access and activate booking.
   */
  async verifyQr(
    bookingId: string,
    userId: string,
    userRole: string,
    verificationCode?: string
  ): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('Only the host or admin can verify QR codes for this space');
    }

    if (verificationCode && verificationCode !== booking.qrVerificationCode) {
      throw new ValidationError('Invalid verification code');
    }

    const updated = await bookingRepository.updateStatus(bookingId, 'ACTIVE');
    if (!updated) {
      throw new NotFoundError('Booking', bookingId);
    }
    return updated;
  }

  private getDayOfWeek(dateStr: string): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return days[d.getUTCDay()];
  }
}

export const bookingService = new BookingService();
