/**
 * ParkKaro AI — Feature: Parking Recommendations (Hardened)
 *
 * POST /ai/recommend
 *
 * Hardening additions vs original:
 * - Zod schema validates Bedrock output shape
 * - Model error detection
 * - Graceful fallback on every failure path (no 503 errors)
 * - Recommendation cap enforced at schema level
 * - Real listing data always sourced from the backend — never from AI output
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  RECOMMEND_SYSTEM_PROMPT,
  buildRecommendUserPrompt,
}                                                     from '../bedrock/prompts';
import { groundRecommendations }                      from '../grounding/validator';
import {
  RecommendationOutputSchema,
  RecommendationOutput,
  ModelErrorSchema,
  validateOutput,
}                                                     from '../grounding/schemas';
import { TOKEN_LIMITS, MODEL_PARAMS }                 from '../bedrock/models';
import type {
  RecommendRequest,
  RecommendResult,
  RecommendedListing,
  BackendListing,
  AIError,
}                                                     from '../types';

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate grounded parking recommendations.
 *
 * ALWAYS returns a RecommendResult — never throws.
 * If AI fails, a non-AI fallback is returned automatically.
 */
export async function generateRecommendations(
  request: RecommendRequest
): Promise<RecommendResult> {
  const { candidates = [], context, userPreferences } = request;

  // Short-circuit: nothing to recommend
  if (candidates.length === 0) {
    return {
      recommendations: [],
      totalCandidates: 0,
      aiNote:          'No candidate listings were available to recommend from.',
    };
  }

  const result = await invokeModel({
    modelId:      primaryModel,
    systemPrompt: RECOMMEND_SYSTEM_PROMPT,
    userMessage:  buildRecommendUserPrompt(
      candidates,
      context,
      userPreferences as Record<string, unknown> | undefined,
    ),
    maxTokens:    TOKEN_LIMITS.RECOMMEND,
    ...MODEL_PARAMS.NATURAL,
  });

  if (isAIError(result)) {
    console.warn('[AI/recommend] Bedrock error, using fallback:', result.code);
    return fallbackRecommendations(candidates, 'AI recommendations unavailable — showing top-rated options.');
  }

  // Stage 1: parse JSON
  const parsed = parseJSON<unknown>(result.content);
  if (!parsed) {
    return fallbackRecommendations(candidates, 'AI returned malformed output — showing top-rated options.');
  }

  // Stage 2: detect model error
  const modelErr = ModelErrorSchema.safeParse(parsed);
  if (modelErr.success) {
    return fallbackRecommendations(candidates, `AI note: ${modelErr.data.reason ?? 'insufficient data'}`);
  }

  // Stage 3: validate shape — cast to ZodType<unknown> to avoid input/output variance issues
  const [validated, schemaErr] = validateOutput<RecommendationOutput>(
    RecommendationOutputSchema as unknown as import('zod').ZodType<RecommendationOutput>,
    parsed
  );
  if (!validated) {
    console.warn('[AI/recommend] Schema validation failed:', schemaErr);
    return fallbackRecommendations(candidates, 'AI output did not match expected format — showing top-rated options.');
  }

  // Stage 4: grounding — remove any hallucinated listing IDs
  const grounded = groundRecommendations(validated.recommendations, candidates);

  if (grounded.length === 0) {
    return fallbackRecommendations(candidates, 'AI recommendations could not be grounded — showing top-rated options.');
  }

  return {
    recommendations: grounded,
    totalCandidates: candidates.length,
    aiNote:          validated.aiNote ?? undefined,
  };
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

/**
 * Non-AI fallback: top listings by DynamoDB rating.
 * The marketplace always works even when Bedrock is down.
 */
function fallbackRecommendations(
  candidates: BackendListing[],
  note: string,
): RecommendResult {
  const topListings = [...candidates]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const recommendations: RecommendedListing[] = topListings.map(listing => ({
    listingId:          listing.listingId,
    listing,
    explanation:        listing.rating
                          ? `Rated ${listing.rating}/5 by ${listing.reviewCount ?? 0} reviewers in ${listing.area}.`
                          : `Available parking in ${listing.area} at ₹${listing.pricePerHour}/hour.`,
    relevanceScore:     listing.rating ? listing.rating / 5 : 0.5,
    matchedPreferences: [],
  }));

  return {
    recommendations,
    totalCandidates: candidates.length,
    aiNote:          note,
  };
}
