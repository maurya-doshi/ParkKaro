import { v4 as uuidv4 } from 'uuid';
import { payoutRepository } from '../repositories/payoutRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { Payout } from '../models/Payout';
import { ValidationError, ForbiddenError } from '../utils/errors';

export interface CreatePayoutParams {
  period?: string; // e.g. '2026-09'
  bookingIds?: string[];
}

export class PayoutService {
  /**
   * Request/generate host payout from authoritative completed, paid bookings.
   * Prevents payout generation for cancelled, unpaid, or previously paid-out bookings.
   */
  async createPayout(
    hostId: string,
    userRole: string,
    params?: CreatePayoutParams
  ): Promise<Payout> {
    if (userRole !== 'HOST' && userRole !== 'ADMIN') {
      throw new ForbiddenError('Only hosts and administrators can request payouts');
    }

    const hostBookings = await bookingRepository.findByHostId(hostId);
    const existingPayouts = await payoutRepository.findByHostId(hostId);

    const alreadyProcessedBookingIds = new Set(
      existingPayouts
        .filter((p) => p.status !== 'FAILED')
        .flatMap((p) => p.bookingIds || [])
    );

    // Filter eligible bookings
    const eligible = hostBookings.filter((b) => {
      // Must be paid
      if (b.paymentStatus !== 'PAID') return false;
      // Must be in valid non-cancelled state
      if (b.bookingStatus === 'CANCELLED') return false;
      // Must not already be paid out
      if (alreadyProcessedBookingIds.has(b.bookingId)) return false;

      // Filter by requested bookingIds if specified
      if (params?.bookingIds && params.bookingIds.length > 0) {
        return params.bookingIds.includes(b.bookingId);
      }

      return true;
    });

    if (eligible.length === 0) {
      throw new ValidationError('No eligible paid bookings found for payout');
    }

    // Authoritatively calculate payout amount from server booking records
    const totalPayoutAmount = eligible.reduce((acc, b) => {
      const earnings = b.hostEarnings !== undefined ? b.hostEarnings : Math.max(0, b.baseAmount - b.platformFee);
      return acc + earnings;
    }, 0);

    const roundedAmount = Math.round(totalPayoutAmount * 100) / 100;
    const payoutId = `payout_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();
    const period = params?.period || timestamp.substring(0, 7);

    const payout: Payout = {
      payoutId,
      hostId,
      amount: roundedAmount,
      currency: 'INR',
      status: 'COMPLETED',
      period,
      bookingIds: eligible.map((b) => b.bookingId),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const created = await payoutRepository.create(payout);

    try {
      await notificationRepository.create({
        userId: hostId,
        type: 'PAYOUT_UPDATE',
        title: 'Payout Processed',
        message: `Your payout of ₹${roundedAmount} for period ${period} has been processed.`,
        data: { payoutId, amount: String(roundedAmount) },
      });
    } catch {
      // Non-critical
    }

    return created;
  }

  /**
   * List payouts for a host.
   */
  async listHostPayouts(
    hostId: string,
    limit = 50
  ): Promise<{ items: Payout[]; pagination: { count: number; limit: number; nextToken: null } }> {
    const payouts = await payoutRepository.findByHostId(hostId);
    payouts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const paginated = payouts.slice(0, limit);
    return {
      items: paginated,
      pagination: {
        count: paginated.length,
        limit,
        nextToken: null,
      },
    };
  }
}

export const payoutService = new PayoutService();
