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
 */

import { Router, Request, Response } from 'express';
import { z }                         from 'zod';
import { optionalAuth }              from '../../middleware/auth';
import { sendSuccess, sendError }    from '../../utils/response';
import { docClient }                 from '../../config/database';
import { env, tableName }            from '../../config/env';

// AI feature modules
// Path from routes.ts: backend/src/handlers/ai/ → 4 levels up → repo root → ai/
import { extractSearchIntent, buildSearchResult, intentToQueryParams } from '../../../../ai/features/search';
import { generateRecommendations }   from '../../../../ai/features/recommend';
import { generatePricingEstimate }   from '../../../../ai/features/pricing';
import { generateListingDescription } from '../../../../ai/features/listing';
import type { AIError }               from '../../../../ai/types';

// DynamoDB
import { ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

/** Generic AIError type-guard — works on any domain union type. */
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
    location:        z.string().optional(),
    date:            z.string().optional(),
    startTime:       z.string().optional(),
    endTime:         z.string().optional(),
    parkingType:     z.string().optional(),
    maxBudget:       z.number().optional(),
    vehicleType:     z.string().optional(),
    amenities:       z.array(z.string()).optional(),
  }).optional(),
});

const RecommendSchema = z.object({
  userId:          z.string().min(1),
  context:         z.string().optional(),
  userPreferences: z.object({
    preferredArea:        z.string().optional(),
    preferredParkingType: z.string().optional(),
    vehicleType:          z.string().optional(),
    budgetRange:          z.object({ min: z.number(), max: z.number() }).optional(),
    requiredAmenities:    z.array(z.string()).optional(),
  }).optional(),
});

const PricingSchema = z.object({
  listingId:        z.string().optional(),
  location:         z.string().optional(),
  parkingType:      z.string().optional(),
  currentHourlyRate: z.number().optional(),
  currentDailyRate:  z.number().optional(),
  amenities:         z.array(z.string()).optional(),
});

const DescriptionSchema = z.object({
  area:         z.string().min(1),
  city:         z.string().optional(),
  parkingType:  z.string().min(1),
  capacity:     z.number().int().positive().optional(),
  vehicleTypes: z.array(z.string()).optional(),
  amenities:    z.array(z.string()),
  pricePerHour: z.number().positive(),
  pricePerDay:  z.number().positive().optional(),
  hostNotes:    z.string().max(500).optional(),
});

// ─── POST /ai/search ──────────────────────────────────────────────────────────

aiRouter.post('/search', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate request
  const parse = SearchSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid search request', parse.error.flatten());
  }
  const { query, filters } = parse.data;

  // 2. Extract search intent via AI
  const intentResult = await extractSearchIntent({ query, filters });

  // If AI completely fails, fall back to a simple area-based search
  let area: string | undefined;
  let queryParams: Record<string, string> = {};

  if (isAIError(intentResult)) {
    console.warn('[AI/search] Bedrock failed, using raw query fallback:', intentResult.code);
    // Best-effort: treat the whole query as an area name
    area = query.split(' ').find(w => w.length > 3) ?? undefined;
    if (area) queryParams.area = area;
  } else {
    queryParams = intentToQueryParams(intentResult);
  }

  // 3. Fetch REAL listings from DynamoDB
  // Use a Scan with filters (in production this would use GSIs)
  let listings: any[] = [];
  try {
    const filterArea = queryParams.area;
    if (filterArea) {
      // Query area-price-index GSI
      const result = await docClient.send(new QueryCommand({
        TableName:              tableName('parking'),
        IndexName:              'area-price-index',
        KeyConditionExpression: '#area = :area',
        FilterExpression:       '#status = :status',
        ExpressionAttributeNames:  { '#area': 'area', '#status': 'status' },
        ExpressionAttributeValues: { ':area': filterArea, ':status': 'ACTIVE' },
        Limit: 20,
      }));
      listings = result.Items ?? [];
    } else {
      // Fall back to city-level scan
      const result = await docClient.send(new ScanCommand({
        TableName:        tableName('parking'),
        FilterExpression: '#status = :status',
        ExpressionAttributeNames:  { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'ACTIVE' },
        Limit: 20,
      }));
      listings = result.Items ?? [];
    }

    // Apply additional filters from intent
    if (queryParams.parkingType) {
      listings = listings.filter(l => l.parkingType === queryParams.parkingType);
    }
    if (queryParams.vehicleType) {
      listings = listings.filter(l => l.vehicleTypes?.includes(queryParams.vehicleType));
    }
    if (queryParams.maxPrice) {
      const max = parseFloat(queryParams.maxPrice);
      listings = listings.filter(l => l.pricePerHour <= max);
    }
    if (queryParams.amenities) {
      const required = queryParams.amenities.split(',');
      listings = listings.filter(l =>
        required.every((a: string) => l.amenities?.includes(a))
      );
    }
  } catch (dbErr: any) {
    console.error('[AI/search] DynamoDB error:', dbErr.message);
    // Return empty results rather than crashing
  }

  // 4. Build final response
  if (isAIError(intentResult)) {
    return sendSuccess(res, {
      listings,
      searchContext: {
        originalQuery:    query,
        extractedIntent:  null,
        resultsCount:     listings.length,
        filtersApplied:   queryParams,
        aiNote:           'AI search unavailable — showing area results.',
      },
    });
  }

  const result = buildSearchResult(query, intentResult, listings);
  return sendSuccess(res, result);
});

// ─── POST /ai/recommend ───────────────────────────────────────────────────────

aiRouter.post('/recommend', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate
  const parse = RecommendSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid recommend request', parse.error.flatten());
  }
  const { userId, context, userPreferences } = parse.data;

  // 2. Fetch candidate listings from DynamoDB (real data)
  // Strategy: fetch active listings, preferring user's preferred area if known
  let candidates: any[] = [];
  try {
    const preferredArea = userPreferences?.preferredArea;
    if (preferredArea) {
      const result = await docClient.send(new QueryCommand({
        TableName:              tableName('parking'),
        IndexName:              'area-price-index',
        KeyConditionExpression: '#area = :area',
        FilterExpression:       '#status = :status',
        ExpressionAttributeNames:  { '#area': 'area', '#status': 'status' },
        ExpressionAttributeValues: { ':area': preferredArea, ':status': 'ACTIVE' },
        Limit: 20,
      }));
      candidates = result.Items ?? [];
    }

    // Supplement with city-wide listings if not enough area candidates
    if (candidates.length < 5) {
      const result = await docClient.send(new ScanCommand({
        TableName:        tableName('parking'),
        FilterExpression: '#status = :status',
        ExpressionAttributeNames:  { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'ACTIVE' },
        Limit: 30,
      }));
      const extra = (result.Items ?? []).filter(
        l => !candidates.some(c => c.listingId === l.listingId)
      );
      candidates = [...candidates, ...extra].slice(0, 20);
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
  } catch (dbErr: any) {
    console.error('[AI/recommend] DynamoDB error:', dbErr.message);
  }

  // 3. Generate AI recommendations
  const result = await generateRecommendations({
    userId,
    context,
    candidates,
    userPreferences,
  });

  // Even if AI error, generateRecommendations always returns a valid fallback
  return sendSuccess(res, result);
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

  let area = location;
  let pType = parkingType ?? 'OPEN';
  let currentRate = currentHourlyRate;
  let currentDailyRateFinal = currentDailyRate;
  let listing: any = null;

  // 2. If listingId provided, fetch the real listing
  if (listingId) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: tableName('parking'),
        Key: { listingId },
      }));
      listing = result.Item;
      if (listing) {
        area       = listing.area;
        pType      = listing.parkingType ?? pType;
        currentRate = currentRate ?? listing.pricePerHour;
        currentDailyRateFinal = currentDailyRateFinal ?? listing.pricePerDay;
      }
    } catch (dbErr: any) {
      console.error('[AI/pricing] DynamoDB get error:', dbErr.message);
    }
  }

  // 3. Fetch comparable listings from same area
  let comparables: any[] = [];
  let areaAveragePrice: number | undefined;
  if (area) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName:              tableName('parking'),
        IndexName:              'area-price-index',
        KeyConditionExpression: '#area = :area',
        FilterExpression:       '#status = :status AND #parkingType = :pt',
        ExpressionAttributeNames: {
          '#area': 'area', '#status': 'status', '#parkingType': 'parkingType',
        },
        ExpressionAttributeValues: {
          ':area': area, ':status': 'ACTIVE', ':pt': pType,
        },
        Limit: 15,
      }));
      comparables = (result.Items ?? []).filter(l => l.listingId !== listingId);
      if (comparables.length > 0) {
        areaAveragePrice = comparables.reduce((sum: number, l: any) => sum + l.pricePerHour, 0) / comparables.length;
        areaAveragePrice = Math.round(areaAveragePrice);
      }
    } catch (dbErr: any) {
      console.error('[AI/pricing] DynamoDB query error:', dbErr.message);
    }
  }

  // 4. Determine demand (simple heuristic — in production this would be from analytics)
  const bookingDemand = comparables.length > 10 ? 'HIGH'
                      : comparables.length > 5  ? 'MEDIUM'
                      : 'LOW';

  // 5. Generate AI pricing estimate
  const estimate = await generatePricingEstimate({
    listingId,
    location:         area,
    parkingType:      pType,
    currentHourlyRate: currentRate,
    currentDailyRate:  currentDailyRateFinal,
    amenities:        amenities ?? listing?.amenities,
    comparables,
    areaAveragePrice,
    bookingDemand,
  });

  if (isAIError(estimate)) {
    return sendError(
      res, 503,
      'AI_UNAVAILABLE',
      estimate.message,
    );
  }

  return sendSuccess(res, {
    listing:          listing ?? null,
    comparables:      comparables.slice(0, 5), // Send limited comparables for context
    areaAveragePrice: areaAveragePrice ?? null,
    bookingDemand,
    suggestion:       estimate,
  });
});

// ─── POST /ai/listing-description ────────────────────────────────────────────

aiRouter.post('/listing-description', optionalAuth, async (req: Request, res: Response) => {
  // 1. Validate
  const parse = DescriptionSchema.safeParse(req.body);
  if (!parse.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid listing-description request', parse.error.flatten());
  }

  // 2. Generate description (no DynamoDB call needed — uses host-provided facts only)
  const result = await generateListingDescription(parse.data);

  if (isAIError(result)) {
    return sendError(
      res, 503,
      'AI_UNAVAILABLE',
      result.message,
    );
  }

  return sendSuccess(res, result);
});
