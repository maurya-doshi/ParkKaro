/**
 * ParkShare AI — Output Schema Validators
 *
 * Zod schemas that validate the raw JSON returned by Bedrock BEFORE
 * it reaches the grounding validator.
 *
 * Two-stage validation:
 *   1. Schema check (this file)  — is the shape correct?
 *   2. Grounding check (validator.ts) — are the values real?
 */

// Using zod from backend node_modules (ai/ is compiled as part of the backend project)
import { z } from 'zod';

// ─── Search Intent Schema ─────────────────────────────────────────────────────

export const SearchIntentOutputSchema = z.object({
  location:        z.string().nullable().optional(),
  date:            z.string().nullable().optional(),
  startTime:       z.string().nullable().optional(),
  endTime:         z.string().nullable().optional(),
  pricePreference: z.enum(['cheap', 'moderate', 'premium']).nullable().optional(),
  maxBudget:       z.number().nullable().optional(),
  parkingType: z.enum([
    'OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL',
  ]).nullable().optional(),
  vehicleType: z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']).nullable().optional(),
  amenities:       z.array(z.string()).optional().default([]),
  confidence:      z.number().min(0).max(1).optional().default(0.5),
  unparsed:        z.string().nullable().optional(),
}).strict();

export type SearchIntentOutput = z.infer<typeof SearchIntentOutputSchema>;

// ─── Recommendation Output Schema ────────────────────────────────────────────

export const RecommendationItemSchema = z.object({
  listingId:          z.string().min(1),
  explanation:        z.string().max(500),
  relevanceScore:     z.number().min(0).max(1),
  matchedPreferences: z.array(z.string()).max(20).optional().default([]),
});

export const RecommendationOutputSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).max(10),
  aiNote:          z.string().max(300).nullable().optional(),
});

export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;

// ─── Pricing Output Schema ────────────────────────────────────────────────────

const RateRangeSchema = z.object({
  min:         z.number().min(0).max(100_000),
  max:         z.number().min(0).max(100_000),
  recommended: z.number().min(0).max(100_000),
});

export const PricingOutputSchema = z.object({
  suggestionType:      z.literal('ESTIMATE'),
  suggestedHourlyRate: RateRangeSchema,
  suggestedDailyRate:  RateRangeSchema.nullable().optional(),
  rationale:           z.string().max(600),
  changeFromCurrent:   z.number().nullable().optional(),
  marketContext: z.object({
    areaAverage:     z.number().nullable().optional(),
    comparableCount: z.number().int().min(0),
    demandLevel:     z.string().nullable().optional(),
  }),
  disclaimer:          z.string().max(500),
});

export type PricingOutput = z.infer<typeof PricingOutputSchema>;

// ─── Description Output Schema ────────────────────────────────────────────────

export const DescriptionOutputSchema = z.object({
  title:         z.string().min(1).max(120),
  description:   z.string().min(1).max(1000),
  highlights:    z.array(z.string().max(150)).max(8),
  groundingNote: z.string().max(300),
});

export type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>;

// ─── Model Error Schema ───────────────────────────────────────────────────────

/** Matches the {"error":"insufficient_data","reason":"..."} shape the model may return */
export const ModelErrorSchema = z.object({
  error:  z.string(),
  reason: z.string().optional(),
});

// ─── Validation helper ────────────────────────────────────────────────────────

/**
 * Parse and validate raw Bedrock JSON output against a Zod schema.
 * Returns [data, null] on success, [null, errorMessage] on failure.
 */
export function validateOutput<T>(
  schema: z.ZodType<T>,
  raw: unknown
): [T, null] | [null, string] {
  const result = schema.safeParse(raw);
  if (result.success) {
    return [result.data, null];
  }
  const msg = result.error.issues.map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`).join('; ');
  return [null, msg];
}
