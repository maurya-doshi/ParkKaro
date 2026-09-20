# ParkKaro — Bedrock AI Documentation

> **Owner:** Person 4 (AI / Amazon Bedrock)  
> **Branch:** `person4/ai`  
> **Last Updated:** 2026-09-18  
> **Status:** Implemented, ready for integration

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Model Configuration](#2-model-configuration)
3. [AI Features & Endpoints](#3-ai-features--endpoints)
4. [Prompts](#4-prompts)
5. [Grounding Rules](#5-grounding-rules)
6. [Tool Definitions](#6-tool-definitions)
7. [Request & Response Formats](#7-request--response-formats)
8. [Error Handling](#8-error-handling)
9. [Token & Cost Considerations](#9-token--cost-considerations)
10. [Security](#10-security)
11. [Example Requests](#11-example-requests)

---

## 1. Architecture Overview

### The Bedrock Contract

Amazon Bedrock is an **AI reasoning and interface layer**. It is **not the source of truth**.

```
Frontend
  ↓  (calls /api/ai/search, /api/ai/recommend, /api/ai/pricing, /api/ai/listing-description)
  ↓  (never calls Bedrock directly)
Backend API Routes  (backend/src/handlers/ai/routes.ts)
  ↓  validates request
  ↓  fetches real data from DynamoDB
AI Feature Module   (ai/features/*.ts)
  ↓  builds grounded prompt with real backend data
Amazon Bedrock (Claude Haiku 3)
  ↓  returns structured JSON
Grounding Validator (ai/grounding/validator.ts)
  ↓  validates AI output against real backend data
  ↓  removes hallucinated IDs / clamps prices / flags suspicious claims
Backend API
  ↓  returns final validated response
Frontend
```

### Authoritative Data Sources

| Data Type | Authority | AI Role |
|-----------|-----------|---------|
| Listings | DynamoDB | Can explain listings; cannot invent them |
| Prices | DynamoDB | Can suggest estimates; cannot set prices |
| Availability | DynamoDB | Cannot invent or override |
| Bookings | DynamoDB | Cannot create or modify |
| Ratings & Reviews | DynamoDB | Cannot invent |
| Distances | Backend (Haversine) | Cannot invent |
| Amenities | DynamoDB (host-provided) | Cannot add or infer |

### File Structure

```
ai/
├── bedrock/
│   ├── client.ts         ← Bedrock SDK wrapper (only file that calls Bedrock)
│   ├── models.ts         ← Model IDs, token limits, cost controls
│   └── prompts.ts        ← All prompt templates
├── features/
│   ├── search.ts         ← Natural language search intent extraction
│   ├── recommend.ts      ← Grounded parking recommendations
│   ├── pricing.ts        ← Host pricing estimates
│   └── listing.ts        ← Listing description generation
├── grounding/
│   └── validator.ts      ← AI output validation (hallucination guard)
├── tools/
│   └── definitions.ts    ← Bedrock tool/function definitions
├── types/
│   └── index.ts          ← TypeScript types
└── README.md
```

---

## 2. Model Configuration

### Primary Model

| Parameter | Value |
|-----------|-------|
| **Model** | `anthropic.claude-3-haiku-20240307-v1:0` |
| **Region** | `ap-south-1` (Mumbai) — configurable via `BEDROCK_REGION` |
| **API Format** | Anthropic Messages API (bedrock-2023-05-31) |

**Why Claude Haiku 3?**
- Fastest and cheapest Claude model
- Excellent at structured JSON extraction
- Good enough for all ParkKaro AI features at hackathon scale
- Cost: ~$0.25/1M input tokens, ~$1.25/1M output tokens

### Token Limits per Feature

| Feature | Max Output Tokens | Rationale |
|---------|-------------------|-----------|
| Search intent extraction | 600 | JSON structure, not much needed |
| Recommendations | 800 | 5 × ~1–2 sentence explanations |
| Pricing suggestion | 700 | JSON + rationale |
| Listing description | 500 | Title + description + highlights |

### Temperature Settings

| Use Case | Temperature | TopP |
|----------|-------------|------|
| Structured (search, pricing) | 0.1 | 0.9 |
| Natural language (recommend, description) | 0.4 | 0.9 |

### Timeout

All Bedrock calls time out at **15 seconds**. If Bedrock doesn't respond, the feature falls back gracefully (see [Error Handling](#8-error-handling)).

---

## 3. AI Features & Endpoints

### 3.1 Natural Language Search — `POST /ai/search`

**What it does:** Extracts structured parking search intent from a natural language query.  
**What AI does:** Intent extraction only. AI never generates or returns listing data.  
**Fallback:** If AI fails, treats the query as a raw area name.

### 3.2 Parking Recommendations — `POST /ai/recommend`

**What it does:** Explains why real backend listings match a user's preferences.  
**What AI does:** Ranks and describes candidates. Cannot invent listing IDs.  
**Fallback:** Returns top-rated listings by DynamoDB rating, with a note.

### 3.3 Host Pricing Assistant — `POST /ai/pricing`

**What it does:** Suggests a pricing estimate based on area market data.  
**What AI does:** Generates an ESTIMATE based on real comparable listings.  
**Fallback:** Simple arithmetic average of comparable listings.

### 3.4 Listing Description — `POST /ai/listing-description`

**What it does:** Generates a professional listing title and description.  
**What AI does:** Writes copy based only on host-provided facts.  
**Fallback:** Template-based description using the same facts.

---

## 4. Prompts

### 4.1 System Prompt Preamble (Shared)

Every system prompt includes this grounding preamble:

```
CRITICAL SAFETY RULES — YOU MUST FOLLOW THESE EXACTLY:
1. NEVER invent or assume any facts about parking listings, prices, availability,
   ratings, distances, hosts, or amenities.
2. ONLY use facts explicitly provided in this request.
3. If information is missing or ambiguous, say so rather than guessing.
4. Return ONLY valid JSON — no prose, no markdown fences, no extra text.
5. If you cannot safely answer, return {"error":"insufficient_data","reason":"<brief reason>"}.
```

### 4.2 Search Intent System Prompt

Instructs the model to extract parking intent into a structured JSON object with:
`location`, `date`, `startTime`, `endTime`, `pricePreference`, `maxBudget`, `parkingType`, `vehicleType`, `amenities`, `confidence`, `unparsed`.

Relative dates (e.g. "tomorrow") are resolved using the current date injected into the user message.

### 4.3 Recommendation System Prompt

Instructs the model to rank and explain real backend candidates. Key constraints:
- Return `listingId` values **exactly as provided** — no modifications
- Explanations must reference only provided listing attributes
- Max 5 recommendations

### 4.4 Pricing System Prompt

Instructs the model to generate pricing estimates from market context data. Key constraints:
- `suggestionType` must always be `"ESTIMATE"`
- Always include the canonical disclaimer
- Base suggestions only on provided data

### 4.5 Description System Prompt

Instructs the model to write listing copy based only on provided facts. Key constraints:
- Do NOT add amenities not listed
- Do NOT add distance claims
- Do NOT add security/safety claims not provided
- Max 120 words for description

---

## 5. Grounding Rules

The grounding validator (`ai/grounding/validator.ts`) enforces these rules after every Bedrock call:

### Search Intent Grounding
- ✅ `date` must match `YYYY-MM-DD` format
- ✅ `startTime` / `endTime` must match `HH:mm`
- ✅ `parkingType` must be in: `OPEN | COVERED | BASEMENT | GARAGE | PRIVATE | COMMERCIAL`
- ✅ `vehicleType` must be in: `CAR | BIKE | SUV | TRUCK | EV`
- ✅ `confidence` clamped to `[0, 1]`
- ✅ `pricePreference` must be `cheap | moderate | premium | null`

### Recommendation Grounding
- ✅ Every `listingId` in AI output must exist in the backend candidate set
- ✅ Any hallucinated listing ID is **silently discarded** (logged as warning)
- ✅ `relevanceScore` clamped to `[0, 1]`
- ✅ `explanation` truncated to 300 characters
- ✅ Real listing data always sourced from backend, never from AI response

### Pricing Grounding
- ✅ `suggestionType` always overwritten to `"ESTIMATE"`
- ✅ Hourly rates clamped: minimum ₹5, maximum 3× area average (or ₹1000 if no area data)
- ✅ `disclaimer` always overwritten with canonical text
- ✅ AI cannot set prices above 3× the area average

### Description Grounding
- ✅ Suspicious pattern detection for potentially hallucinated claims:
  - CCTV/camera claims if not in amenities
  - Security guard claims if not in amenities
  - EV charging claims if not in amenities
  - Covered/indoor claims if parkingType is not COVERED
  - Distance claims ("2 min from metro") if not in hostNotes
- ✅ Suspicious patterns are **logged** for monitoring (output not blocked — host reviews)
- ✅ `groundingNote` always present confirming no claims were added
- ✅ Title capped at 60 characters, description at 800 characters

---

## 6. Tool Definitions

Defined in `ai/tools/definitions.ts`. These are structured function definitions for Bedrock tool use (Claude Haiku supports this via the Messages API).

| Tool | Description | Inputs |
|------|-------------|--------|
| `searchParking` | Search listings with structured filters | area, city, date, startTime, endTime, maxPrice, parkingType, vehicleType, amenities |
| `getParkingDetails` | Get full listing details | listingId |
| `checkAvailability` | Check slot availability | listingId, date, startTime, endTime |
| `getPricingContext` | Get market pricing context | area, parkingType |

> **Note:** In the current implementation, tools are defined but the backend pre-fetches data before calling Bedrock (simpler for hackathon). The tool definitions document the intent for a production tool-use implementation.

---

## 7. Request & Response Formats

### 7.1 POST /ai/search

**Request:**
```json
{
  "query": "I need cheap parking near Koramangala tomorrow from 6 PM to 10 PM",
  "filters": {
    "date": "2026-09-19"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listingId": "listing_abc123",
        "title": "Covered Parking Near Forum Mall",
        "area": "Koramangala",
        "pricePerHour": 25,
        "rating": 4.3,
        "amenities": ["covered", "cctv"]
      }
    ],
    "searchContext": {
      "originalQuery": "I need cheap parking near Koramangala tomorrow from 6 PM to 10 PM",
      "extractedIntent": {
        "location": "Koramangala",
        "date": "2026-09-19",
        "startTime": "18:00",
        "endTime": "22:00",
        "pricePreference": "cheap",
        "maxBudget": 30,
        "parkingType": null,
        "vehicleType": null,
        "amenities": [],
        "confidence": 0.92,
        "unparsed": null
      },
      "resultsCount": 4,
      "filtersApplied": {
        "area": "Koramangala",
        "date": "2026-09-19",
        "startTime": "18:00",
        "endTime": "22:00",
        "maxPrice": 30
      }
    }
  }
}
```

### 7.2 POST /ai/recommend

**Request:**
```json
{
  "userId": "user_driver1",
  "context": "daily commute parking",
  "userPreferences": {
    "preferredArea": "Koramangala",
    "vehicleType": "CAR",
    "budgetRange": { "min": 20, "max": 60 }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "listingId": "listing_abc123",
        "listing": { "listingId": "listing_abc123", "title": "...", "pricePerHour": 40 },
        "explanation": "This covered spot at ₹40/hr fits your budget and has 4.5 stars from 12 reviews.",
        "relevanceScore": 0.87,
        "matchedPreferences": ["preferredArea", "vehicleType", "budgetRange"]
      }
    ],
    "totalCandidates": 8,
    "aiNote": null
  }
}
```

### 7.3 POST /ai/pricing

**Request:**
```json
{
  "listingId": "listing_abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing": { "listingId": "listing_abc123", "area": "Koramangala", "pricePerHour": 35 },
    "comparables": [...],
    "areaAveragePrice": 42,
    "bookingDemand": "MEDIUM",
    "suggestion": {
      "suggestionType": "ESTIMATE",
      "suggestedHourlyRate": {
        "min": 35,
        "max": 55,
        "recommended": 45
      },
      "suggestedDailyRate": {
        "min": 280,
        "max": 380,
        "recommended": 330
      },
      "rationale": "Area average is ₹42/hr. Your listing's covered type commands a slight premium. Current rate of ₹35 is slightly below market.",
      "changeFromCurrent": 28.6,
      "marketContext": {
        "areaAverage": 42,
        "comparableCount": 5,
        "demandLevel": "MEDIUM"
      },
      "disclaimer": "This is an AI-generated estimate for informational purposes only. ParkKaro does not guarantee market prices. Always verify against current market conditions before setting your listing price."
    }
  }
}
```

### 7.4 POST /ai/listing-description

**Request:**
```json
{
  "area": "Koramangala",
  "parkingType": "COVERED",
  "capacity": 1,
  "vehicleTypes": ["CAR", "SUV"],
  "amenities": ["covered", "cctv", "lighting"],
  "pricePerHour": 40,
  "pricePerDay": 300,
  "hostNotes": "Entry from 5th Cross Road"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "title": "Covered Parking in Koramangala",
    "description": "A secure covered parking space in Koramangala, ideal for cars and SUVs. The spot features CCTV surveillance and good lighting, making it a reliable choice for daily or short-term parking. Entry is from 5th Cross Road. Available at ₹40/hour or ₹300/day.",
    "highlights": [
      "Covered parking — protected from rain and sun",
      "CCTV surveillance installed",
      "Well-lit space",
      "₹40/hour or ₹300/day",
      "Entry from 5th Cross Road"
    ],
    "groundingNote": "This description was generated from host-provided facts only. No additional claims were added."
  }
}
```

---

## 8. Error Handling

### AI Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `BEDROCK_UNAVAILABLE` | Bedrock unreachable | Fallback to non-AI response |
| `TIMEOUT` | Bedrock took > 15s | Fallback to non-AI response |
| `PARSE_ERROR` | Model returned invalid JSON | Fallback to non-AI response |
| `GROUNDING_FAILED` | AI output failed validation | Fallback or error response |
| `VALIDATION_ERROR` | Request validation failed | Return 400 to client |

### Fallback Behaviour

| Feature | Fallback |
|---------|----------|
| `/ai/search` | Treat query as area name; run standard search |
| `/ai/recommend` | Return top-rated listings sorted by DynamoDB rating |
| `/ai/pricing` | Return arithmetic average of comparable listings |
| `/ai/listing-description` | Return template-based description from facts |

### Marketplace Resilience

> **AI failures NEVER break the marketplace.**

- Searching works without AI (standard GET /parking)
- Booking works without AI (POST /bookings)
- Payments work without AI
- Availability checking works without AI

---

## 9. Token & Cost Considerations

### Per-Request Token Budget

| Feature | Input Tokens (est.) | Output Tokens | Cost/request (est.) |
|---------|---------------------|---------------|---------------------|
| Search | ~200 | ~150 | ~$0.0002 |
| Recommend | ~800 | ~300 | ~$0.0006 |
| Pricing | ~600 | ~200 | ~$0.0004 |
| Description | ~300 | ~150 | ~$0.0002 |

### Cost Controls Implemented

1. **Max context characters** — Input to Bedrock is capped at 4,000 characters for candidate listings and comparable data, preventing runaway token usage from large database payloads.

2. **Max output tokens** — Hard limits per feature (500–800 tokens). The model cannot generate verbose outputs.

3. **Low temperature** — Structured features use temperature=0.1, reducing retry need.

4. **No AI for normal keyword searches** — Standard `GET /parking` searches bypass Bedrock entirely. AI is only called when the user explicitly uses the AI search endpoint.

5. **Timeout** — 15-second hard timeout prevents slow Bedrock calls from stalling the API.

6. **Model choice** — Claude Haiku 3 is ~6× cheaper than Claude Sonnet 3 for comparable results on structured tasks.

---

## 10. Security

### What AI Can and Cannot Do

| Action | Allowed |
|--------|---------|
| Read listing data provided by backend | ✅ |
| Generate text based on provided facts | ✅ |
| Extract intent from user text | ✅ |
| Create a booking | ❌ |
| Access DynamoDB directly | ❌ |
| Read user PII beyond what is passed | ❌ |
| Override prices | ❌ |
| Override availability | ❌ |
| Generate listing IDs | ❌ |

### Prompt Injection Mitigation

- User-provided query strings are placed inside a clearly delimited section of the user message, not in the system prompt.
- The system prompt is not exposed to users.
- Model outputs are parsed as structured JSON — free-form text is discarded if JSON parsing fails.
- The grounding validator provides a second layer of validation.

### Authentication

- All `/ai/*` endpoints use `optionalAuth` middleware (same as other read-only endpoints).
- No AI feature requires special authentication beyond the standard demo/Cognito auth.
- AI features do not expose or log user passwords, tokens, or PII.

### AWS IAM

The backend Lambda/ECS role needs Bedrock permission in addition to DynamoDB:

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel"
  ],
  "Resource": [
    "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
  ]
}
```

---

## 11. Example Requests

### cURL: Natural Language Search

```bash
curl -X POST http://localhost:3001/ai/search \
  -H "Content-Type: application/json" \
  -H "X-Demo-User-Id: user_driver1" \
  -H "X-Demo-Role: DRIVER" \
  -d '{
    "query": "I need cheap covered parking near Koramangala tomorrow evening from 6 PM to 10 PM"
  }'
```

### cURL: Recommendations

```bash
curl -X POST http://localhost:3001/ai/recommend \
  -H "Content-Type: application/json" \
  -H "X-Demo-User-Id: user_driver1" \
  -H "X-Demo-Role: DRIVER" \
  -d '{
    "userId": "user_driver1",
    "context": "commute_parking",
    "userPreferences": {
      "preferredArea": "Indiranagar",
      "vehicleType": "CAR",
      "budgetRange": { "min": 20, "max": 60 }
    }
  }'
```

### cURL: Host Pricing

```bash
curl -X POST http://localhost:3001/ai/pricing \
  -H "Content-Type: application/json" \
  -H "X-Demo-User-Id: user_host1" \
  -H "X-Demo-Role: HOST" \
  -d '{
    "listingId": "listing_abc123"
  }'
```

### cURL: Listing Description

```bash
curl -X POST http://localhost:3001/ai/listing-description \
  -H "Content-Type: application/json" \
  -H "X-Demo-User-Id: user_host1" \
  -H "X-Demo-Role: HOST" \
  -d '{
    "area": "HSR Layout",
    "city": "Bengaluru",
    "parkingType": "COVERED",
    "capacity": 2,
    "vehicleTypes": ["CAR"],
    "amenities": ["covered", "cctv"],
    "pricePerHour": 35,
    "pricePerDay": 250,
    "hostNotes": "Gate closes at 11 PM. Call before arriving."
  }'
```

---

## Appendix: Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BEDROCK_REGION` | `ap-south-1` | AWS region for Bedrock |
| `AWS_REGION` | `ap-south-1` | Fallback region |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |

All environment variables are loaded via the backend's `config/env.ts`. No Bedrock-specific configuration is needed beyond the region — the SDK uses the standard AWS credentials chain.
