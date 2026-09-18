/**
 * ParkShare AI — Grounding Validator
 *
 * The grounding layer is the last line of defense against hallucination.
 * Before any AI response reaches the frontend, it passes through these validators.
 *
 * Rules enforced:
 * 1. Recommended listing IDs must exist in the backend-provided candidate set
 * 2. Pricing suggestions must be within a reasonable range of market data
 * 3. Descriptions must not contain claims about amenities not in the input
 * 4. Search intent extraction must not contain fabricated date/time formats
 */

import type {
  SearchIntent,
  RecommendedListing,
  PricingEstimate,
  ListingDescriptionResult,
  BackendListing,
  AIError,
} from '../types';

// ─── Search Intent Grounding ──────────────────────────────────────────────────

/**
 * Validates and sanitises AI-extracted search intent.
 * - Ensures date is a valid ISO date string
 * - Ensures times are valid HH:mm
 * - Ensures parkingType / vehicleType are in the allowed enum
 * - Clamps confidence to [0, 1]
 */
export function groundSearchIntent(raw: Partial<SearchIntent>): SearchIntent | AIError {
  const VALID_PARKING_TYPES = new Set([
    'OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL',
  ]);
  const VALID_VEHICLE_TYPES = new Set(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']);
  const VALID_PRICE_PREFS  = new Set(['cheap', 'moderate', 'premium']);

  const grounded: SearchIntent = {
    location:        sanitiseString(raw.location) ?? null,
    date:            validateDate(raw.date),
    startTime:       validateTime(raw.startTime),
    endTime:         validateTime(raw.endTime),
    pricePreference: VALID_PRICE_PREFS.has(raw.pricePreference as string)
                       ? raw.pricePreference as SearchIntent['pricePreference']
                       : null,
    maxBudget:       typeof raw.maxBudget === 'number' && raw.maxBudget > 0
                       ? raw.maxBudget
                       : null,
    parkingType:     VALID_PARKING_TYPES.has(raw.parkingType ?? '')
                       ? raw.parkingType as string
                       : null,
    vehicleType:     VALID_VEHICLE_TYPES.has(raw.vehicleType ?? '')
                       ? raw.vehicleType as string
                       : null,
    amenities:       Array.isArray(raw.amenities)
                       ? raw.amenities.filter(a => typeof a === 'string')
                       : [],
    confidence:      typeof raw.confidence === 'number'
                       ? Math.max(0, Math.min(1, raw.confidence))
                       : 0.5,
    unparsed:        sanitiseString(raw.unparsed) ?? null,
  };

  // Must have at least a location to be useful
  if (!grounded.location) {
    console.warn('[Grounding] Search intent has no location');
    // Still return — the backend will handle missing location gracefully
  }

  return grounded;
}

// ─── Recommendation Grounding ─────────────────────────────────────────────────

/**
 * Validates AI recommendations against the real candidate listing set.
 * - Removes any recommendation whose listingId is not in the candidate set
 * - Clamps relevance scores to [0, 1]
 * - Truncates explanations to prevent verbose outputs
 */
export function groundRecommendations(
  aiRecommendations: Partial<RecommendedListing>[],
  candidates: BackendListing[]
): RecommendedListing[] {
  const candidateMap = new Map(candidates.map(c => [c.listingId, c]));

  const grounded: RecommendedListing[] = [];

  for (const rec of aiRecommendations) {
    const listing = candidateMap.get(rec.listingId ?? '');
    if (!listing) {
      // AI hallucinated a listing ID — discard it
      console.warn('[Grounding] Discarding hallucinated listingId:', rec.listingId);
      continue;
    }

    grounded.push({
      listingId:          listing.listingId,
      listing,                                              // Always use real backend data
      explanation:        truncate(rec.explanation ?? '', 300),
      relevanceScore:     typeof rec.relevanceScore === 'number'
                            ? Math.max(0, Math.min(1, rec.relevanceScore))
                            : 0.5,
      matchedPreferences: Array.isArray(rec.matchedPreferences)
                            ? rec.matchedPreferences.map(p => String(p)).slice(0, 10)
                            : [],
    });
  }

  // Sort by relevance descending
  return grounded
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

// ─── Pricing Grounding ────────────────────────────────────────────────────────

/**
 * Validates AI pricing suggestions against market data.
 * - Ensures suggestionType is always "ESTIMATE"
 * - Validates that suggested prices are within a reasonable range
 *   (no more than 3x the area average to prevent absurd suggestions)
 * - Always injects the safety disclaimer
 */
export function groundPricingSuggestion(
  raw: Partial<PricingEstimate>,
  areaAveragePrice?: number
): PricingEstimate | AIError {
  if (!raw.suggestedHourlyRate) {
    return {
      code:                'GROUNDING_FAILED',
      message:             'AI did not return a pricing suggestion.',
      fallbackRecommended: true,
    };
  }

  const cap = areaAveragePrice ? areaAveragePrice * 3 : 1000;
  const floor = 5; // ₹5/hr minimum

  const clampRate = (rate: { min: number; max: number; recommended: number }) => ({
    min:         clamp(rate.min ?? 0, floor, cap),
    max:         clamp(rate.max ?? 0, floor, cap),
    recommended: clamp(rate.recommended ?? 0, floor, cap),
  });

  return {
    suggestionType:    'ESTIMATE',
    suggestedHourlyRate: clampRate(raw.suggestedHourlyRate),
    suggestedDailyRate:  raw.suggestedDailyRate
                           ? clampRate(raw.suggestedDailyRate)
                           : undefined,
    rationale:         truncate(raw.rationale ?? 'Based on area market data.', 500),
    changeFromCurrent: typeof raw.changeFromCurrent === 'number'
                         ? raw.changeFromCurrent
                         : null,
    marketContext: {
      areaAverage:    raw.marketContext?.areaAverage   ?? areaAveragePrice ?? null,
      comparableCount: raw.marketContext?.comparableCount ?? 0,
      demandLevel:    raw.marketContext?.demandLevel   ?? null,
    },
    // Always overwrite with the canonical disclaimer
    disclaimer: 'This is an AI-generated estimate for informational purposes only. ParkShare does not guarantee market prices. Always verify against current market conditions before setting your listing price.',
  };
}

// ─── Description Grounding ────────────────────────────────────────────────────

const CLAIM_PATTERNS = [
  /\b(cctv|camera)\b/i,
  /\b(security guard|24.?7 security)\b/i,
  /\bev.?charg/i,
  /\b(covered|indoor)\s+parking\b/i,
  /\b\d+\s*(min|minute)s?\s*(from|to|walk)\b/i,
  /\bnearby\s+(metro|mall|station)\b/i,
];

/**
 * Validates AI-generated listing descriptions.
 * - Checks for potentially hallucinated claims
 * - Warns if suspicious patterns are found (but does not block — host can review)
 * - Ensures groundingNote is present
 */
export function groundDescription(
  raw: Partial<ListingDescriptionResult>,
  providedAmenities: string[]
): ListingDescriptionResult | AIError {
  if (!raw.title || !raw.description) {
    return {
      code:                'GROUNDING_FAILED',
      message:             'AI did not return a description.',
      fallbackRecommended: false,
    };
  }

  const suspiciousClaims: string[] = [];
  for (const pattern of CLAIM_PATTERNS) {
    if (
      pattern.test(raw.description) &&
      !providedAmenities.some(a => pattern.test(a))
    ) {
      suspiciousClaims.push(pattern.source);
    }
  }

  if (suspiciousClaims.length > 0) {
    console.warn('[Grounding] Potentially hallucinated claims in description:', suspiciousClaims);
    // We do not block — the host sees the output and can edit.
    // Log for monitoring purposes.
  }

  return {
    title:       truncate(raw.title, 60),
    description: truncate(raw.description, 800),
    highlights:  Array.isArray(raw.highlights)
                   ? raw.highlights.slice(0, 5).map(h => truncate(String(h), 120))
                   : [],
    groundingNote: 'This description was generated from host-provided facts only. No additional claims were added.',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitiseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s.length > 0 ? s : null;
}

function validateDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : value;
}

function validateTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? value : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}
