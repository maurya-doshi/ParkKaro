/**
 * ParkShare AI — Feature: Parking Recommendations
 *
 * POST /ai/recommend
 *
 * Flow:
 * 1. Backend fetches candidate listings from DynamoDB (real data)
 * 2. This module calls Bedrock to rank and explain the candidates
 * 3. Grounding validator removes any hallucinated listing IDs
 * 4. Backend returns real listing data with AI explanations
 *
 * Grounding guarantee:
 * - AI only receives real listings from the backend
 * - AI only recommends listingIds from the provided set
 * - Grounding validator discards any invented IDs
 * - Real listing data is always sourced from the backend, never from AI output
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  RECOMMEND_SYSTEM_PROMPT,
  buildRecommendUserPrompt,
} from '../bedrock/prompts';
import { groundRecommendations } from '../grounding/validator';
import { TOKEN_LIMITS, MODEL_PARAMS } from '../bedrock/models';
import type {
  RecommendRequest,
  RecommendResult,
  RecommendedListing,
  BackendListing,
  AIError,
} from '../types';

/**
 * Generate AI-powered parking recommendations.
 *
 * @param request - Contains userId, context, candidate listings, and user preferences
 * @returns RecommendResult with grounded recommendations, or AIError on failure
 */
export async function generateRecommendations(
  request: RecommendRequest
): Promise<RecommendResult | AIError> {
  const { candidates = [], context, userPreferences } = request;

  if (candidates.length === 0) {
    // No candidates — nothing for AI to recommend
    return {
      recommendations: [],
      totalCandidates:  0,
      aiNote:          'No candidate listings were available to recommend from.',
    };
  }

  const result = await invokeModel({
    modelId:     primaryModel,
    systemPrompt: RECOMMEND_SYSTEM_PROMPT,
    userMessage:  buildRecommendUserPrompt(
      candidates,
      context,
      userPreferences as Record<string, unknown> | undefined
    ),
    maxTokens:    TOKEN_LIMITS.RECOMMEND,
    ...MODEL_PARAMS.NATURAL,
  });

  if (isAIError(result)) {
    // Return fallback: recommend top-rated listings without AI explanation
    return fallbackRecommendations(candidates, request);
  }

  const parsed = parseJSON<{ recommendations?: Partial<RecommendedListing>[]; aiNote?: string }>(
    result.content
  );

  if (!parsed || !Array.isArray(parsed.recommendations)) {
    return fallbackRecommendations(candidates, request);
  }

  // Ground: remove any hallucinated listing IDs, validate scores
  const grounded = groundRecommendations(parsed.recommendations, candidates);

  if (grounded.length === 0) {
    // Grounding removed everything — fall back to non-AI recommendations
    return fallbackRecommendations(candidates, request);
  }

  return {
    recommendations: grounded,
    totalCandidates:  candidates.length,
    aiNote:           parsed.aiNote ?? undefined,
  };
}

/**
 * Fallback recommendations when Bedrock is unavailable or returns invalid data.
 * Returns top listings sorted by rating (descending), with no AI explanation.
 * This ensures the marketplace always functions even when AI is down.
 */
function fallbackRecommendations(
  candidates: BackendListing[],
  request: RecommendRequest
): RecommendResult {
  const topListings = [...candidates]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const recommendations: RecommendedListing[] = topListings.map(listing => ({
    listingId:          listing.listingId,
    listing,
    explanation:        'Highly rated parking spot in your area.',
    relevanceScore:     listing.rating ? listing.rating / 5 : 0.5,
    matchedPreferences: [],
  }));

  return {
    recommendations,
    totalCandidates:  candidates.length,
    aiNote:           'AI recommendations unavailable — showing top-rated options.',
  };
}
