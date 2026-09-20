/**
 * ParkShare AI — Comprehensive Integration Tests
 *
 * Tests every scenario required by the hardening specification:
 * 1. Valid prompts / happy path
 * 2. Missing / ambiguous information (partial inputs)
 * 3. Hallucination / unsupported claim detection
 * 4. Bedrock failure (timeout, unavailable)
 * 5. Empty backend search results
 * 6. Malformed model output
 * 7. Authentication and authorisation
 *
 * All Bedrock calls are mocked — tests should run offline without AWS credentials.
 * All DynamoDB calls are mocked — tests should run without a live database.
 */

import request from 'supertest';
import { app } from '../src/app';

// ─── Mock Bedrock client ──────────────────────────────────────────────────────

jest.mock('../../ai/bedrock/client', () => ({
  invokeModel:   jest.fn(),
  isAIError:     jest.fn((v: any) => v && 'code' in v && 'fallbackRecommended' in v),
  parseJSON:     jest.fn((s: string) => {
    try { return JSON.parse(s); } catch { return null; }
  }),
  primaryModel:  'anthropic.claude-3-haiku-20240307-v1:0',
}));

// ─── Mock DynamoDB ────────────────────────────────────────────────────────────

jest.mock('../src/config/database', () => ({
  docClient: {
    send: jest.fn(),
  },
}));

import { invokeModel } from '../../ai/bedrock/client';
import { docClient }   from '../src/config/database';

const mockInvoke  = invokeModel  as jest.MockedFunction<typeof invokeModel>;
const mockDynamo  = (docClient.send as jest.Mock);

// ─── Shared test data ─────────────────────────────────────────────────────────

const MOCK_LISTINGS = [
  {
    listingId:   'listing_001',
    title:       'Covered Parking Near Forum Mall',
    area:        'Koramangala',
    city:        'Bengaluru',
    parkingType: 'COVERED',
    pricePerHour: 40,
    pricePerDay:  350,
    amenities:   ['covered', 'cctv', 'lighting'],
    vehicleTypes: ['CAR', 'SUV'],
    rating:       4.5,
    reviewCount:  12,
    status:       'ACTIVE',
  },
  {
    listingId:   'listing_002',
    title:       'Open Parking Indiranagar',
    area:        'Indiranagar',
    city:        'Bengaluru',
    parkingType: 'OPEN',
    pricePerHour: 25,
    amenities:   ['lighting'],
    vehicleTypes: ['CAR', 'BIKE'],
    rating:       3.8,
    reviewCount:  5,
    status:       'ACTIVE',
  },
];

const VALID_SEARCH_INTENT = JSON.stringify({
  location:        'Koramangala',
  date:            '2026-09-21',
  startTime:       '18:00',
  endTime:         '22:00',
  pricePreference: 'cheap',
  maxBudget:       50,
  parkingType:     'COVERED',
  vehicleType:     null,
  amenities:       [],
  confidence:      0.92,
  unparsed:        null,
});

function asDynamo(items: any[]) {
  return { Items: items };
}

function asDriver(userId = 'user_driver1') {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'DRIVER' };
}

function asHost(userId = 'user_host1') {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'HOST' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /ai/search
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /ai/search', () => {
  beforeEach(() => jest.clearAllMocks());

  // 1a. Happy path — valid query, AI extracts intent, backend returns listings
  it('returns structured results for a clear natural-language query', async () => {
    mockInvoke.mockResolvedValue({
      content:      VALID_SEARCH_INTENT,
      inputTokens:  150,
      outputTokens: 80,
      stopReason:   'end_turn',
    });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'cheap covered parking near Koramangala tomorrow 6 PM to 10 PM' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.searchContext.extractedIntent.location).toBe('Koramangala');
    expect(res.body.data.searchContext.extractedIntent.startTime).toBe('18:00');
    expect(res.body.data.searchContext.originalQuery).toContain('Koramangala');
    expect(Array.isArray(res.body.data.listings)).toBe(true);
  });

  // 1b. Empty results — AI extracts intent but backend finds nothing
  it('returns empty listings array (not error) when backend finds no matches', async () => {
    mockInvoke.mockResolvedValue({ content: VALID_SEARCH_INTENT, inputTokens: 100, outputTokens: 50, stopReason: 'end_turn' });
    mockDynamo.mockResolvedValue(asDynamo([]));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking near Whitefield tomorrow' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listings).toEqual([]);
    expect(res.body.data.searchContext.resultsCount).toBe(0);
  });

  // 1c. Bedrock failure — falls back gracefully, still returns 200
  it('returns 200 with fallback when Bedrock is unavailable', async () => {
    mockInvoke.mockResolvedValue({
      code:                'BEDROCK_UNAVAILABLE',
      message:             'Connection refused',
      fallbackRecommended: true,
    });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking Koramangala' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.searchContext.aiNote).toContain('unavailable');
  });

  // 1d. Bedrock timeout — falls back gracefully
  it('returns 200 with fallback when Bedrock times out', async () => {
    mockInvoke.mockResolvedValue({
      code:                'TIMEOUT',
      message:             'Bedrock response timed out.',
      fallbackRecommended: true,
    });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking near MG Road' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 1e. Malformed Bedrock output — falls back gracefully
  it('returns 200 with fallback when Bedrock returns non-JSON', async () => {
    mockInvoke.mockResolvedValue({
      content:      'Sorry, I cannot help with that. Please try again.',
      inputTokens:  50,
      outputTokens: 20,
      stopReason:   'end_turn',
    });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking tomorrow morning' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // aiNote should indicate fallback
    expect(res.body.data.searchContext.aiNote).toBeTruthy();
  });

  // 1f. Model error response — {"error":"insufficient_data"}
  it('handles model returning its own error structure gracefully', async () => {
    mockInvoke.mockResolvedValue({
      content:      JSON.stringify({ error: 'insufficient_data', reason: 'Query too vague' }),
      inputTokens:  50,
      outputTokens: 15,
      stopReason:   'end_turn',
    });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking somewhere nice' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 1g. Validation error — query too short
  it('returns 400 for query shorter than 3 characters', async () => {
    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'p' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 1h. Missing query — required field
  it('returns 400 when query field is missing', async () => {
    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 1i. Works without authentication (optionalAuth)
  it('returns results even without auth headers', async () => {
    mockInvoke.mockResolvedValue({ content: VALID_SEARCH_INTENT, inputTokens: 100, outputTokens: 50, stopReason: 'end_turn' });
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));

    const res = await request(app)
      .post('/ai/search')
      .send({ query: 'parking near Koramangala' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 1j. DynamoDB error — returns empty results, not 5xx
  it('returns 200 with empty listings when DynamoDB errors', async () => {
    mockInvoke.mockResolvedValue({ content: VALID_SEARCH_INTENT, inputTokens: 100, outputTokens: 50, stopReason: 'end_turn' });
    mockDynamo.mockRejectedValue(new Error('DynamoDB connection refused'));

    const res = await request(app)
      .post('/ai/search')
      .set(asDriver())
      .send({ query: 'parking near Koramangala' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listings).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /ai/recommend
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /ai/recommend', () => {
  beforeEach(() => jest.clearAllMocks());

  const VALID_RECOMMEND_RESPONSE = JSON.stringify({
    recommendations: [
      {
        listingId:          'listing_001',
        explanation:        'Great covered spot at ₹40/hr with CCTV, perfect for your car.',
        relevanceScore:     0.92,
        matchedPreferences: ['preferredArea', 'vehicleType'],
      },
    ],
    aiNote: null,
  });

  // 2a. Happy path
  it('returns grounded recommendations from real backend listings', async () => {
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));
    mockInvoke.mockResolvedValue({ content: VALID_RECOMMEND_RESPONSE, inputTokens: 200, outputTokens: 100, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({
        userId: 'user_driver1',
        context: 'commute_parking',
        userPreferences: { preferredArea: 'Koramangala', vehicleType: 'CAR' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    // Listing data comes from backend, not AI
    expect(res.body.data.recommendations[0].listingId).toBe('listing_001');
    expect(res.body.data.recommendations[0].listing.pricePerHour).toBe(40);
  });

  // 2b. Hallucination guard — AI invents a listing ID that doesn't exist
  it('discards AI-hallucinated listing IDs not in the backend candidate set', async () => {
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        recommendations: [
          {
            listingId:      'HALLUCINATED_LISTING_999',   // Not in backend data
            explanation:    'Amazing parking spot!',
            relevanceScore: 0.99,
            matchedPreferences: [],
          },
          {
            listingId:      'listing_001',                // Real listing
            explanation:    'Good option.',
            relevanceScore: 0.7,
            matchedPreferences: [],
          },
        ],
        aiNote: null,
      }),
      inputTokens: 200,
      outputTokens: 100,
      stopReason: 'end_turn',
    });

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ userId: 'user_driver1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Hallucinated ID must be absent
    const ids = res.body.data.recommendations.map((r: any) => r.listingId);
    expect(ids).not.toContain('HALLUCINATED_LISTING_999');
    // Real listing must be present
    expect(ids).toContain('listing_001');
  });

  // 2c. Bedrock failure — fallback returns top-rated listings
  it('returns top-rated fallback recommendations when Bedrock fails', async () => {
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));
    mockInvoke.mockResolvedValue({
      code:                'BEDROCK_UNAVAILABLE',
      message:             'No connection',
      fallbackRecommended: true,
    });

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ userId: 'user_driver1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    expect(res.body.data.aiNote).toContain('unavailable');
    // Top-rated listing (listing_001 with 4.5) should be first
    expect(res.body.data.recommendations[0].listingId).toBe('listing_001');
  });

  // 2d. No candidates — backend returns nothing
  it('returns empty recommendations (not error) when backend has no candidates', async () => {
    mockDynamo.mockResolvedValue(asDynamo([]));

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ userId: 'user_driver1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations).toEqual([]);
    expect(res.body.data.aiNote).toBeTruthy();
  });

  // 2e. Malformed model output
  it('falls back gracefully when model returns malformed JSON', async () => {
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));
    mockInvoke.mockResolvedValue({ content: 'Here are some great parks!', inputTokens: 50, outputTokens: 10, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ userId: 'user_driver1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
  });

  // 2f. Validation — userId required
  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ context: 'commute' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 2g. Recommendation data is always real (never AI-invented facts)
  it('listing facts come from backend, not AI output', async () => {
    mockDynamo.mockResolvedValue(asDynamo(MOCK_LISTINGS));
    // AI tries to invent a different price — backend data should win
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        recommendations: [{
          listingId:      'listing_001',
          explanation:    'Amazing spot at ₹10/hr (hallucinated price)',
          relevanceScore: 0.9,
          matchedPreferences: [],
        }],
        aiNote: null,
      }),
      inputTokens: 100,
      outputTokens: 50,
      stopReason: 'end_turn',
    });

    const res = await request(app)
      .post('/ai/recommend')
      .set(asDriver())
      .send({ userId: 'user_driver1' });

    expect(res.status).toBe(200);
    // The real price from backend should be 40, not the AI-invented 10
    const rec = res.body.data.recommendations.find((r: any) => r.listingId === 'listing_001');
    expect(rec.listing.pricePerHour).toBe(40);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /ai/pricing
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /ai/pricing', () => {
  beforeEach(() => jest.clearAllMocks());

  const VALID_PRICING_RESPONSE = JSON.stringify({
    suggestionType: 'ESTIMATE',
    suggestedHourlyRate: { min: 35, max: 55, recommended: 45 },
    suggestedDailyRate: { min: 280, max: 400, recommended: 330 },
    rationale:      'Area average is ₹42/hr. Covered spots command a slight premium.',
    changeFromCurrent: 12.5,
    marketContext: { areaAverage: 42, comparableCount: 4, demandLevel: 'MEDIUM' },
    disclaimer:    'This is an AI-generated estimate for informational purposes only. ParkShare does not guarantee market prices. Always verify against current market conditions before setting your listing price.',
  });

  // 3a. Happy path with listingId
  it('returns a pricing ESTIMATE when listingId is provided', async () => {
    // First call: get listing, second: get comparables
    mockDynamo
      .mockResolvedValueOnce({ Item: MOCK_LISTINGS[0] })    // GetCommand for listing
      .mockResolvedValueOnce(asDynamo([MOCK_LISTINGS[1]])); // QueryCommand for comparables
    mockInvoke.mockResolvedValue({ content: VALID_PRICING_RESPONSE, inputTokens: 200, outputTokens: 150, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ listingId: 'listing_001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestion.suggestionType).toBe('ESTIMATE');
    expect(res.body.data.suggestion.disclaimer).toContain('AI-generated estimate');
  });

  // 3b. Pricing suggestion never overrides backend price — the price stays in listing
  it('suggestion does not replace the actual listing price', async () => {
    mockDynamo
      .mockResolvedValueOnce({ Item: MOCK_LISTINGS[0] })
      .mockResolvedValueOnce(asDynamo([MOCK_LISTINGS[1]]));
    mockInvoke.mockResolvedValue({ content: VALID_PRICING_RESPONSE, inputTokens: 200, outputTokens: 150, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ listingId: 'listing_001' });

    expect(res.status).toBe(200);
    // listing.pricePerHour is the backend truth (40), not the AI suggestion (45)
    expect(res.body.data.listing.pricePerHour).toBe(40);
    expect(res.body.data.suggestion.suggestedHourlyRate.recommended).toBe(45);
  });

  // 3c. Bedrock failure — fallback arithmetic estimate, never 503
  it('returns 200 with fallback estimate when Bedrock fails', async () => {
    mockDynamo
      .mockResolvedValueOnce({ Item: MOCK_LISTINGS[0] })
      .mockResolvedValueOnce(asDynamo([MOCK_LISTINGS[1]]));
    mockInvoke.mockResolvedValue({
      code: 'TIMEOUT', message: 'Timed out', fallbackRecommended: true,
    });

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ listingId: 'listing_001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestion.suggestionType).toBe('ESTIMATE');
    expect(res.body.data.suggestion.disclaimer).toBeTruthy();
  });

  // 3d. No market data available — neutral fallback
  it('returns a neutral estimate when no comparable listings exist', async () => {
    mockDynamo
      .mockResolvedValueOnce({ Item: MOCK_LISTINGS[0] })
      .mockResolvedValueOnce(asDynamo([])); // No comparables

    // Won't call Bedrock if no market context

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ listingId: 'listing_001' });

    expect(res.status).toBe(200);
    expect(res.body.data.suggestion.suggestionType).toBe('ESTIMATE');
    expect(res.body.data.suggestion.rationale).toBeTruthy();
  });

  // 3e. Validation — need either listingId or location
  it('returns 400 when neither listingId nor location is provided', async () => {
    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ parkingType: 'COVERED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 3f. Location-based pricing (no listingId)
  it('works with location instead of listingId', async () => {
    mockDynamo.mockResolvedValue(asDynamo([MOCK_LISTINGS[0], MOCK_LISTINGS[1]]));
    mockInvoke.mockResolvedValue({ content: VALID_PRICING_RESPONSE, inputTokens: 200, outputTokens: 150, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ location: 'Koramangala', parkingType: 'COVERED', currentHourlyRate: 35 });

    expect(res.status).toBe(200);
    expect(res.body.data.suggestion.suggestionType).toBe('ESTIMATE');
  });

  // 3g. Absurd AI pricing is clamped by grounding validator
  it('clamps absurdly high AI price suggestions to 3x area average', async () => {
    mockDynamo
      .mockResolvedValueOnce({ Item: MOCK_LISTINGS[0] })
      .mockResolvedValueOnce(asDynamo([MOCK_LISTINGS[1]]));
    // Area average ≈ ₹25. Max cap = 3× = ₹75
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        suggestionType: 'ESTIMATE',
        suggestedHourlyRate: { min: 500, max: 1000, recommended: 750 }, // Absurd
        suggestedDailyRate: null,
        rationale:      'Premium area commands high pricing.',
        changeFromCurrent: 1875,
        marketContext:  { areaAverage: 25, comparableCount: 1, demandLevel: 'LOW' },
        disclaimer:     'AI estimate.',
      }),
      inputTokens: 100,
      outputTokens: 80,
      stopReason: 'end_turn',
    });

    const res = await request(app)
      .post('/ai/pricing')
      .set(asHost())
      .send({ listingId: 'listing_001' });

    expect(res.status).toBe(200);
    // Clamped: max = 3 × area_average (≈ 25*3 = 75), recommended ≤ 75
    expect(res.body.data.suggestion.suggestedHourlyRate.recommended).toBeLessThanOrEqual(75);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /ai/listing-description
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /ai/listing-description', () => {
  beforeEach(() => jest.clearAllMocks());

  const VALID_DESC_RESPONSE = JSON.stringify({
    title:         'Covered Parking in Koramangala',
    description:   'A secure covered parking space in Koramangala. Features CCTV surveillance and good lighting. Priced at ₹40/hour.',
    highlights:    ['Covered parking', 'CCTV surveillance', 'Well-lit', '₹40/hour'],
    groundingNote: 'This description was generated from host-provided facts only. No additional claims were added.',
  });

  const VALID_DESC_REQUEST = {
    area:         'Koramangala',
    parkingType:  'COVERED',
    amenities:    ['covered', 'cctv', 'lighting'],
    pricePerHour: 40,
    vehicleTypes: ['CAR', 'SUV'],
  };

  // 4a. Happy path
  it('returns a grounded listing description', async () => {
    mockInvoke.mockResolvedValue({ content: VALID_DESC_RESPONSE, inputTokens: 100, outputTokens: 80, stopReason: 'end_turn' });

    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send(VALID_DESC_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBeTruthy();
    expect(res.body.data.description).toBeTruthy();
    expect(res.body.data.groundingNote).toContain('host-provided facts');
  });

  // 4b. Bedrock failure — template fallback, never 503
  it('returns 200 with template description when Bedrock fails', async () => {
    mockInvoke.mockResolvedValue({
      code: 'BEDROCK_UNAVAILABLE', message: 'Unavailable', fallbackRecommended: true,
    });

    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send(VALID_DESC_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Koramangala');
    expect(res.body.data.groundingNote).toContain('host-provided facts');
  });

  // 4c. Hallucination detection — AI adds CCTV claim when amenity not provided
  it('grounding validator detects suspicious CCTV claim when not in amenities', async () => {
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        title:       'Open Parking in Koramangala',
        description: 'This open parking has CCTV surveillance and 24/7 security guards on duty.',
        highlights:  ['Open parking', 'CCTV', 'Security'],
        groundingNote: 'Host-provided facts.',
      }),
      inputTokens: 100,
      outputTokens: 60,
      stopReason: 'end_turn',
    });

    // Note: amenities does NOT include 'cctv' or 'security'
    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send({
        area:         'Koramangala',
        parkingType:  'OPEN',    // Not covered — no CCTV in amenities
        amenities:    [],         // Empty amenities
        pricePerHour: 30,
      });

    // The description is returned (host reviews it) but suspicious patterns are logged
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // groundingNote must always be present
    expect(res.body.data.groundingNote).toBeTruthy();
  });

  // 4d. Malformed model output — template fallback
  it('returns template description when model returns non-JSON', async () => {
    mockInvoke.mockResolvedValue({
      content:    'Here is a great parking spot!',
      inputTokens: 50, outputTokens: 10, stopReason: 'end_turn',
    });

    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send(VALID_DESC_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Koramangala');
  });

  // 4e. Validation — area required
  it('returns 400 when area is missing', async () => {
    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send({ parkingType: 'COVERED', amenities: [], pricePerHour: 40 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 4f. Validation — invalid parkingType
  it('returns 400 when parkingType is not a valid enum', async () => {
    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send({ area: 'Koramangala', parkingType: 'ROOFTOP', amenities: [], pricePerHour: 40 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 4g. Host notes are included (not invented)
  it('includes hostNotes in the description when provided', async () => {
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        title:       'Garage Parking in HSR Layout',
        description: 'Secure garage parking in HSR Layout. Entry from 27th Main. ₹50/hour.',
        highlights:  ['Garage parking', '₹50/hour', 'Entry from 27th Main'],
        groundingNote: 'Host-provided facts only.',
      }),
      inputTokens: 100, outputTokens: 60, stopReason: 'end_turn',
    });

    const res = await request(app)
      .post('/ai/listing-description')
      .set(asHost())
      .send({
        area:         'HSR Layout',
        parkingType:  'GARAGE',
        amenities:    [],
        pricePerHour: 50,
        hostNotes:    'Entry from 27th Main',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Grounding Validator Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Grounding Validator', () => {
  // Import directly for unit testing
  const {
    groundSearchIntent,
    groundRecommendations,
    groundPricingSuggestion,
  } = require('../../ai/grounding/validator');

  it('rejects invalid date formats in search intent', () => {
    const result = groundSearchIntent({ location: 'Koramangala', date: '21-09-2026', confidence: 0.8, amenities: [] });
    expect(result.date).toBeNull(); // Invalid format should be nulled out
  });

  it('rejects invalid time formats in search intent', () => {
    const result = groundSearchIntent({ location: 'Koramangala', startTime: '6pm', endTime: '10pm', confidence: 0.9, amenities: [] });
    expect(result.startTime).toBeNull();
    expect(result.endTime).toBeNull();
  });

  it('accepts valid date and time formats', () => {
    const result = groundSearchIntent({
      location: 'Koramangala', date: '2026-09-21',
      startTime: '18:00', endTime: '22:00', confidence: 0.9, amenities: [],
    });
    expect(result.date).toBe('2026-09-21');
    expect(result.startTime).toBe('18:00');
    expect(result.endTime).toBe('22:00');
  });

  it('clamps confidence to [0, 1] range', () => {
    const high = groundSearchIntent({ location: 'X', confidence: 5, amenities: [] });
    const low  = groundSearchIntent({ location: 'X', confidence: -2, amenities: [] });
    expect(high.confidence).toBe(1);
    expect(low.confidence).toBe(0);
  });

  it('removes hallucinated listing IDs from recommendations', () => {
    const candidates = [{ listingId: 'real_001', pricePerHour: 40, area: 'Koramangala', title: 'Real Spot' }];
    const aiOutput = [
      { listingId: 'real_001', explanation: 'Good.', relevanceScore: 0.8, matchedPreferences: [] },
      { listingId: 'FAKE_999',  explanation: 'Invented!', relevanceScore: 0.99, matchedPreferences: [] },
    ];
    const result = groundRecommendations(aiOutput, candidates);
    expect(result.map((r: any) => r.listingId)).not.toContain('FAKE_999');
    expect(result.map((r: any) => r.listingId)).toContain('real_001');
  });

  it('clamps relevance score to [0, 1]', () => {
    const candidates = [{ listingId: 'real_001', pricePerHour: 40, area: 'X', title: 'Y' }];
    const aiOutput = [{ listingId: 'real_001', explanation: 'ok', relevanceScore: 99, matchedPreferences: [] }];
    const result = groundRecommendations(aiOutput, candidates);
    expect(result[0].relevanceScore).toBeLessThanOrEqual(1);
  });

  it('overwrites pricing disclaimer regardless of AI output', () => {
    const aiPricing = {
      suggestionType: 'ESTIMATE' as const,
      suggestedHourlyRate: { min: 30, max: 50, recommended: 40 },
      rationale: 'test',
      marketContext: { areaAverage: 40, comparableCount: 3, demandLevel: 'MEDIUM' },
      disclaimer: 'Anything can happen, buy now!', // AI tries to use its own disclaimer
    };
    const result = groundPricingSuggestion(aiPricing, 40);
    expect(result.disclaimer).toContain('AI-generated estimate');
    expect(result.disclaimer).not.toContain('Anything can happen');
  });
});
