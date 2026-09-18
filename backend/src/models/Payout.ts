/**
 * Payout model — corresponds to parkshare-payouts table.
 */

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payout {
  payoutId: string;
  hostId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  period: string; // e.g., '2026-09'
  bookingIds: string[];
  createdAt: string;
  updatedAt: string;
}
