import { v4 as uuidv4 } from 'uuid';
import { disputeRepository } from '../repositories/disputeRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { Dispute, DisputeStatus, CreateDisputeInput } from '../models/Dispute';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

// Admin-only status transitions
const ADMIN_ONLY_STATUSES: DisputeStatus[] = ['RESOLVED', 'DISMISSED'];

// Valid state transitions
const VALID_DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  OPEN: ['UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
  UNDER_REVIEW: ['RESOLVED', 'DISMISSED'],
  RESOLVED: [],
  DISMISSED: [],
};

export class DisputeService {
  /**
   * Create a dispute for an eligible booking.
   * - Caller must be driver or host of the booking.
   * - Booking must not already be disputed.
   */
  async createDispute(userId: string, input: CreateDisputeInput): Promise<Dispute> {
    const booking = await bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    if (booking.driverId !== userId && booking.hostId !== userId) {
      throw new ForbiddenError('You can only raise disputes for your own bookings');
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new ValidationError('Cannot raise a dispute on a cancelled booking');
    }

    // Prevent duplicate open dispute for the same booking
    const existing = await disputeRepository.findByBookingId(input.bookingId);
    const openDispute = existing.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
    if (openDispute) {
      throw new ValidationError('An active dispute already exists for this booking');
    }

    const disputeId = `dispute_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    const dispute: Dispute = {
      disputeId,
      bookingId: input.bookingId,
      reportedBy: userId,
      reason: input.reason,
      description: input.description,
      evidence: input.evidence || [],
      status: 'OPEN',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const created = await disputeRepository.create(dispute);

    // Notify other booking party
    try {
      const otherUserId = booking.driverId === userId ? booking.hostId : booking.driverId;
      await notificationRepository.create({
        userId: otherUserId,
        type: 'DISPUTE_UPDATE',
        title: 'Dispute Opened',
        message: `A dispute has been raised for booking ${input.bookingId}: ${input.reason}`,
        data: { disputeId, bookingId: input.bookingId },
      });
    } catch {
      // Non-critical
    }

    return created;
  }

  /**
   * Get a dispute by ID. Caller must be the reporter, booking party, or ADMIN.
   */
  async getDisputeById(disputeId: string, userId: string, userRole: string): Promise<Dispute> {
    const dispute = await disputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute', disputeId);
    }

    if (userRole !== 'ADMIN') {
      const booking = await bookingRepository.findById(dispute.bookingId);
      const isParty =
        dispute.reportedBy === userId ||
        (booking && (booking.driverId === userId || booking.hostId === userId));
      if (!isParty) {
        throw new ForbiddenError('You do not have permission to view this dispute');
      }
    }

    return dispute;
  }

  /**
   * List disputes filed by or against the current user.
   */
  async listUserDisputes(userId: string): Promise<Dispute[]> {
    return disputeRepository.findByReportedBy(userId);
  }

  /**
   * Update dispute status. Only ADMINs can resolve/dismiss.
   */
  async updateDispute(
    disputeId: string,
    userId: string,
    userRole: string,
    status: DisputeStatus,
    resolution?: string
  ): Promise<Dispute> {
    const dispute = await this.getDisputeById(disputeId, userId, userRole);

    // Validate transition
    const allowed = VALID_DISPUTE_TRANSITIONS[dispute.status] || [];
    if (!allowed.includes(status)) {
      throw new ValidationError(
        `Invalid dispute transition from ${dispute.status} to ${status}`
      );
    }

    // Admin-only statuses
    if (ADMIN_ONLY_STATUSES.includes(status) && userRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can resolve or dismiss disputes');
    }

    const updated = await disputeRepository.resolve(
      disputeId,
      resolution || '',
      userId,
      status
    );
    if (!updated) {
      throw new NotFoundError('Dispute', disputeId);
    }

    // Notify the reporter about status update
    try {
      await notificationRepository.create({
        userId: dispute.reportedBy,
        type: 'DISPUTE_UPDATE',
        title: `Dispute ${status}`,
        message: `Your dispute for booking ${dispute.bookingId} has been ${status.toLowerCase()}.${resolution ? ` Resolution: ${resolution}` : ''}`,
        data: { disputeId, status, bookingId: dispute.bookingId },
      });
    } catch {
      // Non-critical
    }

    return updated;
  }
}

export const disputeService = new DisputeService();
