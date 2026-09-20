# ParkShare — AI Module (Person 4)

> **Owner:** Person 4 (AI / Amazon Bedrock)  
> **Branch:** `person4/ai`  
> **Last Updated:** 2026-09-18

---

## Overview

This folder contains the Amazon Bedrock integration for ParkShare's AI features.

The AI layer sits **between** the backend API and Amazon Bedrock. It:
1. Receives requests from the backend API routes (`/ai/*`)
2. Calls Amazon Bedrock with grounded, controlled prompts
3. Returns validated, structured responses grounded in real backend data

**The AI layer NEVER invents marketplace facts.**  
Backend / DynamoDB remains the single source of truth for: listings, prices, availability, bookings, ratings, reviews, hosts, distances, and amenities.

---

## Structure

```
ai/
├── bedrock/
│   ├── client.ts         # Bedrock client factory + InvokeModel wrapper
│   ├── models.ts         # Model IDs and configuration
│   └── prompts.ts        # All system/user prompt templates
├── features/
│   ├── search.ts         # Natural language search intent extraction
│   ├── recommend.ts      # Grounded parking recommendations
│   ├── pricing.ts        # Host pricing suggestions (estimates only)
│   └── listing.ts        # Listing description generation
├── grounding/
│   └── validator.ts      # AI response grounding + hallucination guard
├── tools/
│   └── definitions.ts    # Tool/function definitions for Bedrock tool use
├── types/
│   └── index.ts          # Shared TypeScript types
└── README.md
```

---

## Architecture

```
Frontend
  ↓  (calls /api/ai/search, /api/ai/recommend, etc.)
Backend API Routes  (backend/src/handlers/ai/routes.ts)
  ↓  (validates request, calls backend services for real data)
AI Module (this folder)
  ↓  (calls Bedrock with grounded context)
Amazon Bedrock (Claude Haiku)
  ↓  (returns structured JSON response)
AI Module grounding validator
  ↓  (validates response against real backend data)
Backend API — returns final response to Frontend
```

---

## AI Features

| Endpoint | Feature | Description |
|----------|---------|-------------|
| `POST /ai/search` | Natural Language Search | Extract structured search intent from plain text |
| `POST /ai/recommend` | Parking Recommendations | Explain why backend-returned listings match user needs |
| `POST /ai/pricing` | Host Pricing Assistant | Estimate pricing based on market context (always labeled ESTIMATE) |
| `POST /ai/listing-description` | Listing Description | Generate description from host-provided facts only |

---

## Safety Rules

- AI **never** invents listing IDs, prices, ratings, availability, or host info
- AI **never** creates or modifies bookings
- AI failures **never** break search, booking, payments, or availability
- All AI estimates are clearly labeled as such
- If information is unavailable, AI says so — does not fabricate

See `docs/BEDROCK_AI.md` for full documentation.
