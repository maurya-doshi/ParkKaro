/**
 * ParkShare AI Routes — backend/src/handlers/ai/routes.ts
 *
 * Implements the /ai/* endpoints as defined in API_CONTRACT.md §19.
 *
 * Architecture note:
 *   Frontend → /api/ai/* → THIS FILE → ai/ module → Bedrock → grounding → response
 *
 * These routes:
 * 1. Validate the incoming request
 * 2. Fetch real backend data from DynamoDB
 * 3. Pass the real data to the AI module
 * 4. Return grounded, validated results to the frontend
 *
 * AI NEVER controls:
 *   - Listings (Person 2 / DynamoDB is authoritative)
 *   - Prices (DynamoDB is authoritative)
 *   - Availability (DynamoDB is authoritative)
 *   - Bookings (backend only)
 *
 * HARDENING GUARANTEES:
 *   - Every AI call is wrapped in try/catch; failures return 200 with fallback data
 *   - /ai/search, /ai/recommend always return 200 (never 5xx)
 *   - /ai/pricing always returns 200 (never 5xx); suggestion is always "ESTIMATE"
 *   - /ai/listing-description always returns 200 (never 5xx)
 *   - DynamoDB errors return empty data, not 5xx
 */

import { Router, Request, Response } from 'express';
import { z }                         from 'zod';
import { optionalAuth }              from '../../middleware/auth';
import { sendSuccess, sendError }    from '../../utils/response';
import { docClient }                 from '../../config/database';
import { tableName }                 from '../../config/env';

// AI feature modules
// Path from routes.ts: backend/src/handlers/ai/ → 4 levels up → repo root → ai/
import { extractSearchIntent, buildSearchResult, intentToQueryParams } from '../../../../ai/features/search';
import { generateRecommendations }    from '../../../../ai/features/recommend';
import { generatePricingEstimate }    from '../../../../ai/features/pricing';
import { generateListingDescription } from '../../../../ai/features/listing';
import type { AIError }               from '../../../../ai/types';

// DynamoDB
import { ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// ─── Generic AIError type-guard ───────────────────────────────────────────────

function isAIError(value: unknown): value is AIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'fallbackRecommended' in value
  );
}

export const aiRouter = Router();

// ─── Input Schemas ────────────────────────────────────────────────────────────

const SearchSchema = z.object({
  query:   z.string().min(3).max(500),
  filters: z.object({
    location:    z.string().optional(),
    date:        z.string().optional(),
    startTime:   z.string().optional(),
    endTime:     z.string().optional(),
    parkingType: z.string().optional(),
    maxBudget:   z.number().optional(),
    vehicleType: z.string().optional(),
    amenities:   z.array(z.string()).optional(),
  }).optional(),
});

const RecommendSchema = z.object({
  userId:          z.string().min(1).max(200),
  context:         z.string().max(200).optional(),
  userPreferences: z.object({
    preferredArea:        z.string().max(100).optional(),
    preferredParkingType: z.string().max(50).optional(),
    vehicleType:          z.string().max(20).optional(),
    budgetRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }).optional(),
    requiredAmenities: z.array(z.string().max(50)).max(10).optional(),
  }).optional(),
});

const PricingSchema = z.object({
  listingId:         z.string().max(200).optional(),
  location:          z.string().max(100).optional(),
  parkingType:       z.enum(['OPEN','COVERED','BASEMENT','GARAGE','PRIVATE','COMMERCIAL']).optional(),
  currentHourlyRate: z.number().min(0).max(100_000).optional(),
  currentDailyRate:  z.number().min(0).max(100_000).optional(),
  amenities:         z.array(z.string().max(50)).max(20).optional(),
}).refine(
  data => data.listingId != null || data.location != null,
  { message: 'Provide at least one of: listingId, location' }
);

const DescriptionSchema = z.object({
  area:         z.string().min(1).max(100),
  city:         z.string().max(100).optional(),
  parkingType:  z.enum(['OPEN','COVERED','BASEMENT','GARAGE','PRIVATE','COMMERCIAL']),
  capacity:     z.number().int().positive().max(1000).optional(),
  vehicleTypes: z.array(z.enum(['CAR','BIKE','SUV','TRUCK','EV'])).optional(),
  amenities:    z.array(z.string().max(50)).max(20),
  pricePerHour: z.number().positive().max(100_000),
  pricePerDay:  z.number().positive().max(100_000).optional(),
  hostNotes:    z.string().max(500).optional(),
});

// ─── DynamoDB helpers ─────────────────────────────────────────────────────────

async function fetchListingsByArea(area: string, maxPrice?: string): Promise<any[]> {
  try {
    if (maxPrice) {
      const result = await docClient.send(new QueryCommand({
        TableName:              tableName('parking'),
        IndexName:              'area-price-index',
        KeyConditionExpression: '#area = :area AND pricePerHour <= :maxPrice',
        FilterExpression:       '#status = :status',
        ExpressionAttributeNames:  { '#area': 'area', '#status': 'status' },
        ExpressionAttributeValues: {
          ':area': area, ':status': 'ACTIVE', ':maxPrice': parseFloat(maxPrice),
        },
        Limit: 20,
      }));
      return result.Items ?? [];
    }
    const result = await docClient.send(new QueryCommand({
      TableName:              tableName('parking'),
      IndexName:              'area-price-index',
      KeyConditionExpression: '#area = :area',
      FilterExpression:       '#status = :status',
      ExpressionAttributeNames:  { '#area': 'area', '#status': 'status' },
      ExpressionAttributeValues: { ':area': area, ':status': 'ACTIVE' },
      Limit: 20,
    }));
    return result.Items ?? [];
  } catch (err: any) {
    console.error('[AI/routes] DynamoDB area query error:', err.message);
    return [];
  }
}

async function fetchActiveListings(limit = 20): Promise<any[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName:        tableName('parking'),
      FilterExpression: '#status = :status',
      ExpressionAttributeNames:  { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'ACTIVE' },
      Limit: limit,
    }));
    return result.Items ?? [];
  } catch (err: any) {
    console.error('[AI/routes] DynamoDB scan error:', err.message);
    return [];
  }
}

async function fetchListingById(listingId: string): Promise<any | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: tableName('parking'),
      Key: { listingId },
    }));
    return result.Item ?? null;
  } catch (err: any) {
    console.error('[AI/routes] DynamoDB get error:', err.message);
    return null;
  }
}

async function fetchComparableListings(area: string, parkingType: string, excludeId?: string): Promise<any[]> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName:              tableName('parking'),
      IndexName:              'area-price-index',
      KeyConditionExpression: '#area = :area',
      FilterExpression:       '#status = :status AND parkingType = :pt',
      ExpressionAttributeNames:  { '#area': 'area', '#status': 'status' },
      ExpressionAttributeValues: { ':area': area, ':status': 'ACTIVE', ':pt': parkingType },
      Limit: 15,
    }));
    const items = result.Items ?? [];
    return excludeId ? items.filter(l => l.listingId !== excludeId) : items;
  } catch (err: any) {
    console.error('[AI/routes] DynamoDB comparables error:', err.message);
    return [];
  }
}

// ─── POST /ai/search ──────────────────────────────────────────────────────────

aiRouter.post('/search', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate request
  const parse = SearchSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid search request', parse.error.flatten());
  }
  const { query, filters } = parse.data;

  try {
    // 2. Extract search intent via AI
    const intentResult = await extractSearchIntent({ query, filters });

    let queryParams: Record<string, string> = {};
    let intentForResponse = intentResult;

    if (isAIError(intentResult)) {
      console.warn('[AI/search] AI failed, using raw query fallback:', intentResult.code);
      // Best-effort: extract the longest word as area hint
      const words = query.split(/\s+/).filter(w => w.length > 3);
      const areaHint = words[0];
      if (areaHint) queryParams.area = areaHint;
    } else {
      queryParams = intentToQueryParams(intentResult);
    }

    // 3. Fetch REAL listings from DynamoDB
    let listings: any[] = [];
    if (queryParams.area) {
      listings = await fetchListingsByArea(queryParams.area, queryParams.maxPrice);
    } else {
      listings = await fetchActiveListings(20);
    }

    // Apply in-memory filters for parking type, vehicle type, amenities
    if (queryParams.parkingType) {
      listings = listings.filter(l => l.parkingType === queryParams.parkingType);
    }
    if (queryParams.vehicleType) {
      listings = listings.filter(l => l.vehicleTypes?.includes(queryParams.vehicleType));
    }
    if (queryParams.amenities) {
      const required = queryParams.amenities.split(',');
      listings = listings.filter(l =>
        required.every((a: string) => l.amenities?.includes(a))
      );
    }

    // 4. Build response
    if (isAIError(intentForResponse)) {
      return sendSuccess(res, {
        listings,
        searchContext: {
          originalQuery:   query,
          extractedIntent: null,
          resultsCount:    listings.length,
          filtersApplied:  queryParams,
          aiNote:          'AI search unavailable — showing best-match results.',
        },
      });
    }

    return sendSuccess(res, buildSearchResult(query, intentForResponse, listings));
  } catch (err: any) {
    // Catch-all — search must never return 5xx
    console.error('[AI/search] Unexpected error:', err.message);
    return sendSuccess(res, {
      listings:     [],
      searchContext: {
        originalQuery:   query,
        extractedIntent: null,
        resultsCount:    0,
        filtersApplied:  {},
        aiNote:          'Search encountered an error. Please try again.',
      },
    });
  }
});

// ─── POST /ai/recommend ───────────────────────────────────────────────────────

aiRouter.post('/recommend', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate
  const parse = RecommendSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid recommend request', parse.error.flatten());
  }
  const { userId, context, userPreferences } = parse.data;

  try {
    // 2. Fetch candidate listings from DynamoDB (real data)
    let candidates: any[] = [];

    const preferredArea = userPreferences?.preferredArea;
    if (preferredArea) {
      candidates = await fetchListingsByArea(preferredArea);
    }

    // Supplement if not enough area candidates
    if (candidates.length < 5) {
      const extra = await fetchActiveListings(30);
      const seen = new Set(candidates.map(c => c.listingId));
      candidates = [...candidates, ...extra.filter(l => !seen.has(l.listingId))].slice(0, 20);
    }

    // Apply preference filters
    if (userPreferences?.vehicleType) {
      candidates = candidates.filter(l =>
        l.vehicleTypes?.includes(userPreferences.vehicleType)
      );
    }
    if (userPreferences?.budgetRange) {
      const { min, max } = userPreferences.budgetRange;
      candidates = candidates.filter(l =>
        l.pricePerHour >= min && l.pricePerHour <= max
      );
    }
    if (userPreferences?.requiredAmenities?.length) {
      candidates = candidates.filter(l =>
        userPreferences.requiredAmenities!.every((a: string) => l.amenities?.includes(a))
      );
    }

    // 3. Generate AI recommendations (always returns a value — never throws)
    const result = await generateRecommendations({ userId, context, candidates, userPreferences });
    return sendSuccess(res, result);

  } catch (err: any) {
    console.error('[AI/recommend] Unexpected error:', err.message);
    return sendSuccess(res, {
      recommendations: [],
      totalCandidates: 0,
      aiNote:          'Recommendations unavailable — please try again.',
    });
  }
});

// ─── POST /ai/pricing ─────────────────────────────────────────────────────────

aiRouter.post('/pricing', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate
  const parse = PricingSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid pricing request', parse.error.flatten());
  }
  const {
    listingId, location, parkingType,
    currentHourlyRate, currentDailyRate, amenities,
  } = parse.data;

  try {
    let area = location;
    let pType = parkingType ?? 'OPEN';
    let currentRate = currentHourlyRate;
    let currentDailyRateFinal = currentDailyRate;
    let listing: any = null;

    // 2. Fetch the real listing if listingId provided
    if (listingId) {
      listing = await fetchListingById(listingId);
      if (listing) {
        area                = listing.area;
        pType               = listing.parkingType ?? pType;
        currentRate         = currentRate         ?? listing.pricePerHour;
        currentDailyRateFinal = currentDailyRateFinal ?? listing.pricePerDay;
      }
    }

    // 3. Fetch comparables and compute area average
    let comparables: any[] = [];
    let areaAveragePrice: number | undefined;

    if (area) {
      comparables = await fetchComparableListings(area, pType, listingId);
      if (comparables.length > 0) {
        areaAveragePrice = Math.round(
          comparables.reduce((sum: number, l: any) => sum + l.pricePerHour, 0) / comparables.length
        );
      }
    }

    // 4. Demand heuristic
    const bookingDemand = comparables.length > 10 ? 'HIGH'
                        : comparables.length > 5  ? 'MEDIUM'
                        : 'LOW';

    // 5. Generate AI pricing estimate (always returns a value — never throws)
    const estimate = await generatePricingEstimate({
      listingId,
      location:          area,
      parkingType:       pType,
      currentHourlyRate: currentRate,
      currentDailyRate:  currentDailyRateFinal,
      amenities:         amenities ?? listing?.amenities,
      comparables,
      areaAveragePrice,
      bookingDemand,
    });

    return sendSuccess(res, {
      listing:          listing ?? null,
      comparables:      comparables.slice(0, 5),
      areaAveragePrice: areaAveragePrice ?? null,
      bookingDemand,
      suggestion:       estimate,
    });

  } catch (err: any) {
    console.error('[AI/pricing] Unexpected error:', err.message);
    // Return a safe neutral estimate
    return sendSuccess(res, {
      listing:          null,
      comparables:      [],
      areaAveragePrice: null,
      bookingDemand:    'UNKNOWN',
      suggestion: {
        suggestionType:      'ESTIMATE',
        suggestedHourlyRate: { min: 30, max: 60, recommended: 40 },
        rationale:           'Default estimate — could not retrieve market data.',
        changeFromCurrent:   null,
        marketContext:       { areaAverage: null, comparableCount: 0, demandLevel: null },
        disclaimer: 'This is an AI-generated estimate for informational purposes only.',
      },
    });
  }
});

// ─── POST /ai/listing-description ────────────────────────────────────────────

aiRouter.post('/listing-description', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate
  const parse = DescriptionSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid listing-description request', parse.error.flatten());
  }

  try {
    // 2. Generate description (always returns a value — never throws)
    const result = await generateListingDescription(parse.data);
    return sendSuccess(res, result);
  } catch (err: any) {
    console.error('[AI/listing-description] Unexpected error:', err.message);
    // Template fallback
    return sendSuccess(res, {
      title:       `Parking in ${parse.data.area}`,
      description: `Parking space in ${parse.data.area} at ₹${parse.data.pricePerHour}/hour.`,
      highlights:  [`Located in ${parse.data.area}`, `₹${parse.data.pricePerHour}/hour`],
      groundingNote: 'Description generated from host-provided facts only.',
    });
  }
});
