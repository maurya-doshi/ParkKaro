/**
 * ParkKaro AI — Feature: Host Pricing Assistant (Hardened)
 *
 * POST /ai/pricing
 *
 * Hardening additions vs original:
 * - Zod schema validates Bedrock output shape
 * - Model error detection
 * - ALWAYS returns a PricingEstimate (never throws / never 503)
 * - Suggests are always labeled ESTIMATE and capped at 3× area average
 * - Fallback arithmetic calculation when Bedrock is unavailable
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  PRICING_SYSTEM_PROMPT,
  buildPricingUserPrompt,
}                                                     from '../bedrock/prompts';
import { groundPricingSuggestion }                    from '../grounding/validator';
import {
  PricingOutputSchema,
  ModelErrorSchema,
  validateOutput,
}                                                     from '../grounding/schemas';
import { TOKEN_LIMITS, MODEL_PARAMS }                 from '../bedrock/models';
import type {
  PricingRequest,
  PricingEstimate,
  BackendListing,
}                                                     from '../types';

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate an AI pricing estimate for a host's listing.
 *
 * ALWAYS returns a PricingEstimate — never throws.
 * If Bedrock fails, a fallback arithmetic estimate is returned.
 * The estimate is ALWAYS labeled "ESTIMATE" — it is never authoritative.
 */
export async function generatePricingEstimate(
  request: PricingRequest
): Promise<PricingEstimate> {
  const {
    location       = 'Unknown area',
    parkingType    = 'OPEN',
    currentHourlyRate,
    comparables    = [],
    areaAveragePrice,
    bookingDemand,
  } = request;

  // If we have zero market context, return a safe arithmetic fallback immediately
  if (!areaAveragePrice && comparables.length === 0) {
    console.warn('[AI/pricing] No market context — returning neutral fallback estimate');
    return neutralFallback(currentHourlyRate);
  }

  const result = await invokeModel({
    modelId:      primaryModel,
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
    console.warn('[AI/pricing] Bedrock error, using fallback:', result.code);
    return fallbackPricingEstimate(areaAveragePrice, comparables, currentHourlyRate);
  }

  // Stage 1: parse JSON
  const parsed = parseJSON<unknown>(result.content);
  if (!parsed) {
    return fallbackPricingEstimate(areaAveragePrice, comparables, currentHourlyRate);
  }

  // Stage 2: detect model error
  if (ModelErrorSchema.safeParse(parsed).success) {
    return fallbackPricingEstimate(areaAveragePrice, comparables, currentHourlyRate);
  }

  // Stage 3: validate shape
  const [validated, schemaErr] = validateOutput(PricingOutputSchema, parsed);
  if (!validated) {
    console.warn('[AI/pricing] Schema validation failed:', schemaErr);
    return fallbackPricingEstimate(areaAveragePrice, comparables, currentHourlyRate);
  }

  // Stage 4: grounding — clamp rates, overwrite disclaimer
  // Cast: Zod nullable vs optional difference is safe at runtime
  const grounded = groundPricingSuggestion(validated as unknown as Partial<import('../types').PricingEstimate>, areaAveragePrice);
  if ('code' in grounded) {
    // grounding returned an AIError — use fallback
    return fallbackPricingEstimate(areaAveragePrice, comparables, currentHourlyRate);
  }

  return grounded;
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const CANONICAL_DISCLAIMER =
  'This is an AI-generated estimate for informational purposes only. ' +
  'ParkKaro does not guarantee market prices. ' +
  'Always verify against current market conditions before setting your listing price.';

/**
 * Fallback: compute estimate from area average and comparables.
 * Used when Bedrock is unavailable or returns invalid data.
 */
function fallbackPricingEstimate(
  areaAveragePrice?: number,
  comparables: BackendListing[] = [],
  currentHourlyRate?: number,
): PricingEstimate {
  let base = areaAveragePrice;

  if (!base && comparables.length > 0) {
    base = comparables.reduce((sum, c) => sum + c.pricePerHour, 0) / comparables.length;
    base = Math.round(base);
  }

  if (!base) {
    return neutralFallback(currentHourlyRate);
  }

  const minRate = Math.max(5, Math.round(base * 0.8));
  const maxRate = Math.round(base * 1.2);

  const changeFromCurrent = currentHourlyRate != null
    ? Math.round(((base - currentHourlyRate) / currentHourlyRate) * 100 * 10) / 10
    : null;

  return {
    suggestionType:      'ESTIMATE',
    suggestedHourlyRate: { min: minRate, max: maxRate, recommended: Math.round(base) },
    suggestedDailyRate:  {
      min:         minRate * 7,
      max:         maxRate * 7,
      recommended: Math.round(base * 7),
    },
    rationale:         'Estimate based on area average price from comparable listings.',
    changeFromCurrent,
    marketContext: {
      areaAverage:     base,
      comparableCount: comparables.length,
      demandLevel:     null,
    },
    disclaimer: CANONICAL_DISCLAIMER,
  };
}

/**
 * Neutral fallback when no market context is available at all.
 * Returns a ₹40/hour baseline (ParkKaro market default).
 */
function neutralFallback(currentHourlyRate?: number): PricingEstimate {
  const base = currentHourlyRate ?? 40;
  return {
    suggestionType:      'ESTIMATE',
    suggestedHourlyRate: {
      min:         Math.max(5, Math.round(base * 0.85)),
      max:         Math.round(base * 1.15),
      recommended: Math.round(base),
    },
    suggestedDailyRate: undefined,
    rationale:          'Insufficient market data to generate a specific estimate. Showing a neutral estimate based on your current rate.',
    changeFromCurrent:  null,
    marketContext: {
      areaAverage:     null,
      comparableCount: 0,
      demandLevel:     null,
    },
    disclaimer: CANONICAL_DISCLAIMER,
  };
}
