/**
 * ParkKaro AI — Shared TypeScript Types
 *
 * These types represent the structures used by all AI features.
 * They are strictly grounded in the backend's API contract.
 */

// ─── Search Intent ────────────────────────────────────────────────────────────

export interface SearchIntent {
  /** Area/neighbourhood (e.g. "Koramangala", "Indiranagar") */
  location: string | null;
  /** ISO date string YYYY-MM-DD */
  date: string | null;
  /** HH:mm start time */
  startTime: string | null;
  /** HH:mm end time */
  endTime: string | null;
  /** "cheap" | "moderate" | "premium" | null */
  pricePreference: 'cheap' | 'moderate' | 'premium' | null;
  /** Max budget per hour in INR */
  maxBudget: number | null;
  /** e.g. "COVERED", "OPEN", "BASEMENT" */
  parkingType: string | null;
  /** e.g. "CAR", "BIKE", "SUV", "EV" */
  vehicleType: string | null;
  /** Required amenities e.g. ["cctv", "evCharging"] */
  amenities: string[];
  /** Confidence 0–1 */
  confidence: number;
  /** Any aspects the model could not parse */
  unparsed: string | null;
}

export interface SearchRequest {
  query: string;
  /** Pre-filled filters the frontend may pass — AI merges/overrides if needed */
  filters?: Partial<SearchIntent>;
}

export interface SearchResult {
  /** Real backend listings — only listing IDs from backend are used */
  listings: BackendListing[];
  searchContext: {
    originalQuery: string;
    extractedIntent: SearchIntent;
    resultsCount: number;
    filtersApplied: Record<string, unknown>;
    aiNote?: string;
  };
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface RecommendRequest {
  userId: string;
  context?: string;
  /** Pre-fetched candidate listings from backend */
  candidates?: BackendListing[];
  /** User preferences from their profile / history */
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  preferredArea?: string;
  preferredParkingType?: string;
  vehicleType?: string;
  budgetRange?: { min: number; max: number };
  requiredAmenities?: string[];
}

export interface RecommendedListing {
  listingId: string;
  /** Real listing data from backend — never invented */
  listing: BackendListing;
  /** AI-generated explanation grounded in real listing data */
  explanation: string;
  /** 0–1 relevance score from AI (purely advisory) */
  relevanceScore: number;
  /** Which user preference this matches */
  matchedPreferences: string[];
}

export interface RecommendResult {
  recommendations: RecommendedListing[];
  totalCandidates: number;
  aiNote?: string;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface PricingRequest {
  listingId?: string;
  location?: string;
  parkingType?: string;
  currentHourlyRate?: number;
  currentDailyRate?: number;
  amenities?: string[];
  /** Comparable listings from the same area — fetched by backend */
  comparables?: BackendListing[];
  areaAveragePrice?: number;
  bookingDemand?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PricingEstimate {
  /** Always "ESTIMATE" — never authoritative */
  suggestionType: 'ESTIMATE';
  suggestedHourlyRate: {
    min: number;
    max: number;
    recommended: number;
  };
  suggestedDailyRate?: {
    min: number;
    max: number;
    recommended: number;
  };
  /** AI reasoning grounded in area data */
  rationale: string;
  /** Percentage change from current rate, if provided */
  changeFromCurrent?: number | null;
  marketContext: {
    areaAverage: number | null;
    comparableCount: number;
    demandLevel: string | null;
  };
  /** Always present — reminds consumer this is an estimate */
  disclaimer: string;
}

// ─── Listing Description ──────────────────────────────────────────────────────

export interface ListingDescriptionRequest {
  /** Host-provided facts only — AI must not add to these */
  area: string;
  city?: string;
  parkingType: string;
  capacity?: number;
  vehicleTypes?: string[];
  amenities: string[];
  pricePerHour: number;
  pricePerDay?: number;
  /** Any specific notes the host wants to include */
  hostNotes?: string;
}

export interface ListingDescriptionResult {
  title: string;
  description: string;
  /** Bullet-point highlights derived only from provided facts */
  highlights: string[];
  /** Always present — confirms no invention */
  groundingNote: string;
}

// ─── Shared / Backend Types ───────────────────────────────────────────────────

/** Minimal listing shape from backend — matches API_CONTRACT.md */
export interface BackendListing {
  listingId: string;
  hostId?: string;
  title: string;
  description?: string;
  address?: string;
  area: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  parkingType?: string;
  capacity?: number;
  vehicleTypes?: string[];
  pricePerHour: number;
  pricePerDay?: number;
  amenities?: string[];
  photos?: string[];
  rating?: number;
  reviewCount?: number;
  distance?: number;
  status?: string;
}

// ─── AI Error ─────────────────────────────────────────────────────────────────

export interface AIError {
  code: 'BEDROCK_UNAVAILABLE' | 'GROUNDING_FAILED' | 'PARSE_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR';
  message: string;
  /** If true, the consumer should fall back to standard non-AI behaviour */
  fallbackRecommended: boolean;
}

// ─── Bedrock ──────────────────────────────────────────────────────────────────

export interface BedrockInvokeOptions {
  modelId: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface BedrockResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
}
