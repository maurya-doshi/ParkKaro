/**
 * ParkKaro AI — Model Configuration
 *
 * Centralized model IDs and configuration for Amazon Bedrock.
 * All hackathon usage is optimised for cost and latency.
 */

// ─── Model IDs ────────────────────────────────────────────────────────────────

export const BEDROCK_MODELS = {
  /**
   * Primary model: Claude Haiku 3 (claude-3-haiku-20240307)
   * - Fastest and cheapest Claude model
   * - Excellent for structured JSON extraction
   * - Good enough for all ParkKaro AI features
   * Input:  $0.25 / 1M tokens
   * Output: $1.25 / 1M tokens
   */
  PRIMARY: 'anthropic.claude-3-haiku-20240307-v1:0',

  /**
   * Fallback model: Claude Instant (claude-instant-v1)
   * Only used if Haiku is unavailable in the region.
   */
  FALLBACK: 'anthropic.claude-instant-v1',
} as const;

// ─── Token Limits ─────────────────────────────────────────────────────────────

export const TOKEN_LIMITS = {
  /** Natural language search intent extraction */
  SEARCH:      600,
  /** Recommendation explanations */
  RECOMMEND:   800,
  /** Pricing suggestions */
  PRICING:     700,
  /** Listing description generation */
  DESCRIPTION: 500,
} as const;

// ─── Model Parameters ─────────────────────────────────────────────────────────

export const MODEL_PARAMS = {
  /**
   * Low temperature for structured outputs (search, pricing).
   * Higher predictability, less creativity.
   */
  STRUCTURED: {
    temperature: 0.1,
    topP:        0.9,
  },
  /**
   * Slightly higher temperature for natural-language outputs
   * (recommendations, descriptions).
   */
  NATURAL: {
    temperature: 0.4,
    topP:        0.9,
  },
} as const;

// ─── Request Timeouts ─────────────────────────────────────────────────────────

/** Bedrock call timeout in milliseconds. Keep low for hackathon demo. */
export const BEDROCK_TIMEOUT_MS = 15_000;

// ─── Cost Guard ───────────────────────────────────────────────────────────────

/**
 * Maximum input characters before we truncate the prompt context.
 * Prevents runaway token usage from very large backend payloads.
 */
export const MAX_CONTEXT_CHARS = 4_000;
