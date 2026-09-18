/**
 * ParkShare AI — Feature: Natural Language Search
 *
 * POST /ai/search
 *
 * Flow:
 * 1. Backend receives natural language query from frontend
 * 2. This module calls Bedrock to extract structured search intent
 * 3. Backend uses the extracted intent to query DynamoDB
 * 4. Only real backend listings are returned — AI never invents listings
 *
 * Grounding guarantee: AI only extracts intent. It never generates listings.
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  SEARCH_SYSTEM_PROMPT,
  buildSearchUserPrompt,
} from '../bedrock/prompts';
import { groundSearchIntent } from '../grounding/validator';
import { TOKEN_LIMITS, MODEL_PARAMS } from '../bedrock/models';
import type {
  SearchRequest,
  SearchIntent,
  BackendListing,
  SearchResult,
  AIError,
} from '../types';

/**
 * Extract structured parking search intent from a natural language query.
 *
 * Returns a SearchIntent the backend can use to query DynamoDB,
 * or an AIError if Bedrock fails (callers must handle gracefully).
 */
export async function extractSearchIntent(
  request: SearchRequest
): Promise<SearchIntent | AIError> {
  const todayDate = new Date().toISOString().split('T')[0];

  // Merge any pre-filled filters from the frontend into the query context
  const queryWithContext = request.filters
    ? `${request.query}\n\n[Context already known: ${JSON.stringify(request.filters)}]`
    : request.query;

  const result = await invokeModel({
    modelId:     primaryModel,
    systemPrompt: SEARCH_SYSTEM_PROMPT,
    userMessage:  buildSearchUserPrompt(queryWithContext, todayDate),
    maxTokens:    TOKEN_LIMITS.SEARCH,
    ...MODEL_PARAMS.STRUCTURED,
  });

  if (isAIError(result)) {
    return result;
  }

  // Parse and validate the response
  const parsed = parseJSON<Partial<SearchIntent>>(result.content);
  if (!parsed) {
    return {
      code:                'PARSE_ERROR',
      message:             'Bedrock returned unparseable search intent.',
      fallbackRecommended: true,
    };
  }

  // Check if model itself returned an error structure
  if ('error' in parsed) {
    return {
      code:                'GROUNDING_FAILED',
      message:             `Model error: ${(parsed as any).reason ?? 'unknown'}`,
      fallbackRecommended: true,
    };
  }

  // Ground and validate the extracted intent
  return groundSearchIntent(parsed);
}

/**
 * Build the final search result response.
 *
 * Called by the backend after performing the actual DynamoDB query.
 * The AI only contributed the intent extraction; the backend fetched real listings.
 */
export function buildSearchResult(
  originalQuery: string,
  intent: SearchIntent,
  listings: BackendListing[],
): SearchResult {
  const filtersApplied: Record<string, unknown> = {};
  if (intent.location)        filtersApplied.area         = intent.location;
  if (intent.date)            filtersApplied.date         = intent.date;
  if (intent.startTime)       filtersApplied.startTime    = intent.startTime;
  if (intent.endTime)         filtersApplied.endTime      = intent.endTime;
  if (intent.parkingType)     filtersApplied.parkingType  = intent.parkingType;
  if (intent.vehicleType)     filtersApplied.vehicleType  = intent.vehicleType;
  if (intent.maxBudget)       filtersApplied.maxPrice     = intent.maxBudget;
  if (intent.amenities?.length) filtersApplied.amenities  = intent.amenities;

  return {
    listings,
    searchContext: {
      originalQuery,
      extractedIntent:  intent,
      resultsCount:     listings.length,
      filtersApplied,
      aiNote:           intent.confidence < 0.5
                          ? 'Low confidence extraction — some filters may be approximate.'
                          : undefined,
    },
  };
}

/**
 * Convert a SearchIntent to backend API query parameters.
 *
 * This maps AI-extracted intent to the GET /parking query parameters
 * defined in API_CONTRACT.md.
 */
export function intentToQueryParams(intent: SearchIntent): Record<string, string> {
  const params: Record<string, string> = {};

  if (intent.location)          params.area        = intent.location;
  if (intent.date)              params.date        = intent.date;
  if (intent.startTime)         params.startTime   = intent.startTime;
  if (intent.endTime)           params.endTime     = intent.endTime;
  if (intent.parkingType)       params.parkingType = intent.parkingType;
  if (intent.vehicleType)       params.vehicleType = intent.vehicleType;
  if (intent.maxBudget)         params.maxPrice    = String(intent.maxBudget);
  if (intent.amenities?.length) params.amenities   = intent.amenities.join(',');

  // Map price preference to a maxPrice if no explicit budget was given
  if (!intent.maxBudget && intent.pricePreference === 'cheap') {
    params.maxPrice = '30';
  } else if (!intent.maxBudget && intent.pricePreference === 'moderate') {
    params.maxPrice = '80';
  }

  return params;
}
