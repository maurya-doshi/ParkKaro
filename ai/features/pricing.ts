/**
 * ParkShare AI — Feature: Host Pricing Assistant
 *
 * POST /ai/pricing
 *
 * Flow:
 * 1. Backend fetches comparable listings and area average price from DynamoDB
 * 2. This module calls Bedrock with real market context
 * 3. Bedrock returns a pricing ESTIMATE (never authoritative)
 * 4. Grounding validator clamps prices to sensible ranges
 * 5. Response always includes a disclaimer that this is an estimate
 *
 * Grounding guarantee:
 * - Pricing suggestions are based ONLY on real backend market data provided
 * - All suggestions are clearly labeled "ESTIMATE"
 * - Suggestions are capped at 3x area average to prevent absurd outputs
 * - Backend pricing authority (Person 2 / DynamoDB) is never overridden
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  PRICING_SYSTEM_PROMPT,
  buildPricingUserPrompt,
} from '../bedrock/prompts';
import { groundPricingSuggestion } from '../grounding/validator';
import { TOKEN_LIMITS, MODEL_PARAMS } from '../bedrock/models';
import type {
  PricingRequest,
  PricingEstimate,
  BackendListing,
  AIError,
} from '../types';

/**
 * Generate an AI pricing estimate for a host's listing.
 *
 * Returns a PricingEstimate or an AIError.
 * The estimate is ALWAYS labeled as such — never authoritative.
 */
export async function generatePricingEstimate(
  request: PricingRequest
): Promise<PricingEstimate | AIError> {
  const {
    location       = 'Unknown area',
    parkingType    = 'OPEN',
    currentHourlyRate,
    comparables    = [],
    areaAveragePrice,
    bookingDemand,
  } = request;

  // If we have no market context, return a graceful error
  if (!areaAveragePrice && comparables.length === 0) {
    return {
      code:                'GROUNDING_FAILED',
      message:             'Insufficient market data to generate a pricing estimate.',
      fallbackRecommended: false,
    };
  }

  const result = await invokeModel({
    modelId:     primaryModel,
    systemPrompt: PRICING_SYSTEM_PROMPT,
    userMessage:  buildPricingUserPrompt(
      location,
      parkingType,
      currentHourlyRate,
      areaAveragePrice,
      bookingDemand,
      comparables,
    ),
    maxTokens:    TOKEN_LIMITS.PRICING,
    ...MODEL_PARAMS.STRUCTURED,
  });

  if (isAIError(result)) {
    // Return a simple estimate based on area average if AI fails
    return fallbackPricingEstimate(areaAveragePrice, comparables);
  }

  const parsed = parseJSON<Partial<PricingEstimate>>(result.content);

  if (!parsed) {
    return fallbackPricingEstimate(areaAveragePrice, comparables);
  }

  // Ground: validate and clamp the estimate
  return groundPricingSuggestion(parsed, areaAveragePrice);
}

/**
 * Fallback pricing estimate when Bedrock is unavailable.
 * Calculates a simple estimate from area average and comparable data.
 */
function fallbackPricingEstimate(
  areaAveragePrice?: number,
  comparables: BackendListing[] = []
): PricingEstimate {
  // Compute average from comparables if area average not available
  let avgPrice = areaAveragePrice;
  if (!avgPrice && comparables.length > 0) {
    avgPrice = comparables.reduce((sum, c) => sum + c.pricePerHour, 0) / comparables.length;
  }

  const base   = avgPrice ?? 40; // Default to ₹40/hr if no data
  const minRate = Math.round(base * 0.8);
  const maxRate = Math.round(base * 1.2);

  return {
    suggestionType: 'ESTIMATE',
    suggestedHourlyRate: {
      min:         minRate,
      max:         maxRate,
      recommended: Math.round(base),
    },
    suggestedDailyRate: {
      min:         minRate * 7,
      max:         maxRate * 7,
      recommended: Math.round(base * 7),
    },
    rationale:         'Estimate based on area average price from comparable listings.',
    changeFromCurrent: undefined,
    marketContext: {
      areaAverage:     avgPrice ?? null,
      comparableCount: comparables.length,
      demandLevel:     null,
    },
    disclaimer: 'This is an AI-generated estimate for informational purposes only. ParkShare does not guarantee market prices. Always verify against current market conditions before setting your listing price.',
  };
}
