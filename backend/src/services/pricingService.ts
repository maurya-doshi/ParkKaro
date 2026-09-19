import { calculatePrice, PriceBreakdown } from '../utils/pricing';
import { env } from '../config/env';

export class PricingService {
  /**
   * Authoritatively calculate pricing for a listing and time interval.
   * Server is the single source of truth: frontend pricing inputs are ignored.
   */
  calculate(
    pricePerHour: number,
    startTime: string,
    endTime: string,
    commissionOverride?: number,
    taxOverride?: number
  ): PriceBreakdown {
    return calculatePrice(pricePerHour, startTime, endTime, commissionOverride, taxOverride);
  }

  /**
   * Calculate net host earnings after deducting platform commission.
   */
  calculateHostEarnings(baseAmount: number, commissionPercent = env.platformCommissionPercent): number {
    const fee = Math.round(baseAmount * (commissionPercent / 100) * 100) / 100;
    return Math.max(0, Math.round((baseAmount - fee) * 100) / 100);
  }
}

export const pricingService = new PricingService();
