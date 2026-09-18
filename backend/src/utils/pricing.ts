import { env } from '../config/env';
import { durationInHours } from './dates';

/**
 * Price breakdown returned by the pricing engine.
 */
export interface PriceBreakdown {
  baseAmount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  durationHours: number;
  ratePerHour: number;
  commissionPercent: number;
  taxPercent: number;
}

/**
 * Calculate the full price breakdown for a booking.
 *
 * @param pricePerHour - The listing's hourly rate
 * @param startTime - ISO 8601 start time
 * @param endTime - ISO 8601 end time
 * @param commissionOverride - Optional override for platform commission %
 * @param taxOverride - Optional override for tax %
 */
export function calculatePrice(
  pricePerHour: number,
  startTime: string,
  endTime: string,
  commissionOverride?: number,
  taxOverride?: number
): PriceBreakdown {
  const hours = durationInHours(startTime, endTime);

  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }

  const commissionPercent = commissionOverride ?? env.platformCommissionPercent;
  const taxPercent = taxOverride ?? env.taxPercent;

  // Round up to the nearest half-hour for billing
  const billableHours = Math.ceil(hours * 2) / 2;

  const baseAmount = roundToTwo(billableHours * pricePerHour);
  const platformFee = roundToTwo(baseAmount * (commissionPercent / 100));
  const tax = roundToTwo(baseAmount * (taxPercent / 100));
  const totalAmount = roundToTwo(baseAmount + platformFee + tax);

  return {
    baseAmount,
    platformFee,
    tax,
    totalAmount,
    durationHours: billableHours,
    ratePerHour: pricePerHour,
    commissionPercent,
    taxPercent,
  };
}

/**
 * Calculate host earnings from a booking amount.
 * Host receives: baseAmount - platform commission on base
 */
export function calculateHostEarnings(baseAmount: number, commissionPercent?: number): number {
  const commission = commissionPercent ?? env.platformCommissionPercent;
  return roundToTwo(baseAmount * (1 - commission / 100));
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
