/**
 * ParkShare AI — Feature: Natural Language Search (Hardened)
 *
 * POST /ai/search
 *
 * Hardening additions vs original:
 * - Zod schema validates Bedrock JSON output shape before grounding
 * - Model error response {"error":...} is detected and handled
 * - Every code path returns a typed value (no silent undefined)
 * - Low-confidence extractions are flagged in searchContext.aiNote
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  SEARCH_SYSTEM_PROMPT,
  buildSearchUserPrompt,
} from '../bedrock/prompts';
import { groundSearchIntent }                        from '../grounding/validator';
import {
  SearchIntentOutputSchema,
  ModelErrorSchema,
  validateOutput,
}                                                     from '../grounding/schemas';
import { TOKEN_LIMITS, MODEL_PARAMS }                 from '../bedrock/models';
import type {
  SearchRequest,
  SearchIntent,
  BackendListing,
  SearchResult,
  AIError,
}                                                     from '../types';

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Extract structured parking search intent from a natural language query.
 *
 * Returns SearchIntent (always with grounded fields) or AIError.
 * Callers must handle both branches — AI failure is never fatal.
 */
export async function extractSearchIntent(
  request: SearchRequest
): Promise<SearchIntent | AIError> {
  const todayDate = new Date().toISOString().split('T')[0];

  // Merge any pre-filled filters into context
  const queryWithContext = request.filters && Object.keys(request.filters).length > 0
    ? `${request.query}\n\n[Caller context: ${JSON.stringify(request.filters)}]`
    : request.query;

  const result = await invokeModel({
    modelId:      primaryModel,
    systemPrompt: SEARCH_SYSTEM_PROMPT,
    userMessage:  buildSearchUserPrompt(queryWithContext, todayDate),
    maxTokens:    TOKEN_LIMITS.SEARCH,
    ...MODEL_PARAMS.STRUCTURED,
  });

  if (isAIError(result)) {
    return result;
  }

  // Stage 1: parse raw JSON
  const parsed = parseJSON<unknown>(result.content);
  if (!parsed) {
    return {
      code:                'PARSE_ERROR',
      message:             'Bedrock returned non-JSON content for search intent.',
      fallbackRecommended: true,
    };
  }

  // Stage 2: detect model's own error response
  const modelErr = ModelErrorSchema.safeParse(parsed);
  if (modelErr.success) {
    return {
      code:                'GROUNDING_FAILED',
      message:             `Model insufficient data: ${modelErr.data.reason ?? modelErr.data.error}`,
      fallbackRecommended: true,
    };
  }

  // Stage 3: validate shape
  const [validated, schemaErr] = validateOutput(SearchIntentOutputSchema, parsed);
  if (!validated) {
    console.warn('[AI/search] Schema validation failed:', schemaErr);
    return {
      code:                'PARSE_ERROR',
      message:             `Search intent schema invalid: ${schemaErr}`,
      fallbackRecommended: true,
    };
  }

  // Stage 4: grounding check
  return groundSearchIntent(validated);
}

// ─── Result builder ───────────────────────────────────────────────────────────

/**
 * Build the final search result response.
 * Listings come from the backend only — AI contributed the intent extraction.
 */
export function buildSearchResult(
  originalQuery: string,
  intent: SearchIntent,
  listings: BackendListing[],
): SearchResult {
  const filtersApplied: Record<string, unknown> = {};
  if (intent.location)          filtersApplied.area        = intent.location;
  if (intent.date)              filtersApplied.date        = intent.date;
  if (intent.startTime)         filtersApplied.startTime   = intent.startTime;
  if (intent.endTime)           filtersApplied.endTime     = intent.endTime;
  if (intent.parkingType)       filtersApplied.parkingType = intent.parkingType;
  if (intent.vehicleType)       filtersApplied.vehicleType = intent.vehicleType;
  if (intent.maxBudget)         filtersApplied.maxPrice    = intent.maxBudget;
  if (intent.amenities?.length) filtersApplied.amenities   = intent.amenities;

  let aiNote: string | undefined;
  if (intent.confidence < 0.4) {
    aiNote = 'Very low extraction confidence — search filters may be inaccurate. Try rephrasing your query.';
  } else if (intent.confidence < 0.6) {
    aiNote = 'Moderate extraction confidence — some filters may be approximate.';
  }
  if (intent.unparsed) {
    aiNote = (aiNote ? aiNote + ' ' : '') + `Could not interpret: "${intent.unparsed}"`;
  }

  return {
    listings,
    searchContext: {
      originalQuery,
      extractedIntent:  intent,
      resultsCount:     listings.length,
      filtersApplied,
      aiNote,
    },
  };
}

// ─── Query param converter ────────────────────────────────────────────────────

/**
 * Map a SearchIntent to backend GET /parking query parameters
 * (as defined in API_CONTRACT.md §4).
 */
export function intentToQueryParams(intent: SearchIntent): Record<string, string> {
  const params: Record<string, string> = {};

  if (intent.location)          params.area        = intent.location;
  if (intent.date)              params.date        = intent.date;
  if (intent.startTime)         params.startTime   = intent.startTime;
  if (intent.endTime)           params.endTime     = intent.endTime;
  if (intent.parkingType)       params.parkingType = intent.parkingType;
  if (intent.vehicleType)       params.vehicleType = intent.vehicleType;
  if (intent.maxBudget != null) params.maxPrice    = String(intent.maxBudget);
  if (intent.amenities?.length) params.amenities   = intent.amenities.join(',');

  // Map price preference to a maxPrice ceiling if no explicit budget was given
  if (intent.maxBudget == null) {
    if (intent.pricePreference === 'cheap')    params.maxPrice = '30';
    if (intent.pricePreference === 'moderate') params.maxPrice = '80';
    // 'premium' — no upper cap
  }

  return params;
}
