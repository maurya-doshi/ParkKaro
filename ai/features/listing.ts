/**
 * ParkShare AI — Feature: Listing Description Generator (Hardened)
 *
 * POST /ai/listing-description
 *
 * Hardening additions vs original:
 * - Zod schema validates Bedrock output shape
 * - Model error detection
 * - ALWAYS returns a ListingDescriptionResult (never throws / never 503)
 * - Grounding validator flags but does not silently suppress suspicious content
 * - Fallback template covers all host-provided facts
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  DESCRIPTION_SYSTEM_PROMPT,
  buildDescriptionUserPrompt,
}                                                     from '../bedrock/prompts';
import { groundDescription }                          from '../grounding/validator';
import {
  DescriptionOutputSchema,
  ModelErrorSchema,
  validateOutput,
}                                                     from '../grounding/schemas';
import { TOKEN_LIMITS, MODEL_PARAMS }                 from '../bedrock/models';
import type {
  ListingDescriptionRequest,
  ListingDescriptionResult,
}                                                     from '../types';

// ─── Maps ──────────────────────────────────────────────────────────────────────

const PARKING_TYPE_LABELS: Record<string, string> = {
  OPEN:       'open-air',
  COVERED:    'covered',
  BASEMENT:   'basement',
  GARAGE:     'garage',
  PRIVATE:    'private',
  COMMERCIAL: 'commercial',
};

const AMENITY_LABELS: Record<string, string> = {
  covered:    'covered parking',
  cctv:       'CCTV surveillance',
  security:   '24/7 security',
  lighting:   'well-lit',
  evCharging: 'EV charging',
  accessible: 'wheelchair accessible',
  '24x7':     '24/7 access',
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate a listing title and description from host-provided facts.
 *
 * ALWAYS returns a ListingDescriptionResult — never throws.
 * If Bedrock fails, a template-based description is returned.
 */
export async function generateListingDescription(
  request: ListingDescriptionRequest
): Promise<ListingDescriptionResult> {
  // Build a human-readable facts object (undefined fields stripped)
  const facts: Record<string, unknown> = Object.fromEntries(
    Object.entries({
      area:         request.area,
      city:         request.city ?? 'Bengaluru',
      parkingType:  PARKING_TYPE_LABELS[request.parkingType] ?? request.parkingType,
      capacity:     request.capacity ? `${request.capacity} space(s)` : undefined,
      vehicleTypes: request.vehicleTypes?.join(', ') ?? undefined,
      amenities:    request.amenities.map(a => AMENITY_LABELS[a] ?? a).join(', ') || 'None specified',
      pricePerHour: `₹${request.pricePerHour}/hour`,
      pricePerDay:  request.pricePerDay ? `₹${request.pricePerDay}/day` : undefined,
      hostNotes:    request.hostNotes ?? undefined,
    }).filter(([, v]) => v !== undefined)
  );

  const result = await invokeModel({
    modelId:      primaryModel,
    systemPrompt: DESCRIPTION_SYSTEM_PROMPT,
    userMessage:  buildDescriptionUserPrompt(facts),
    maxTokens:    TOKEN_LIMITS.DESCRIPTION,
    ...MODEL_PARAMS.NATURAL,
  });

  if (isAIError(result)) {
    console.warn('[AI/listing] Bedrock error, using fallback:', result.code);
    return fallbackDescription(request);
  }

  // Stage 1: parse JSON
  const parsed = parseJSON<unknown>(result.content);
  if (!parsed) {
    return fallbackDescription(request);
  }

  // Stage 2: detect model error
  if (ModelErrorSchema.safeParse(parsed).success) {
    return fallbackDescription(request);
  }

  // Stage 3: validate shape
  const [validated, schemaErr] = validateOutput(DescriptionOutputSchema, parsed);
  if (!validated) {
    console.warn('[AI/listing] Schema validation failed:', schemaErr);
    return fallbackDescription(request);
  }

  // Stage 4: grounding — flag suspicious claims
  const grounded = groundDescription(validated, request.amenities);
  if ('code' in grounded) {
    return fallbackDescription(request);
  }

  return grounded;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

/**
 * Template-based description using ONLY host-provided facts.
 * No AI involvement — guaranteed safe against hallucination.
 */
function fallbackDescription(
  request: ListingDescriptionRequest,
): ListingDescriptionResult {
  const typeLabel = PARKING_TYPE_LABELS[request.parkingType] ?? request.parkingType;
  const capLabel  = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
  const amenityLabels = request.amenities.map(a => AMENITY_LABELS[a] ?? a);

  const title = `${capLabel} Parking in ${request.area}`;

  const parts: string[] = [`Parking space available in ${request.area}.`];
  if (amenityLabels.length > 0) parts.push(`Features: ${amenityLabels.join(', ')}.`);
  if (request.vehicleTypes?.length) parts.push(`Suitable for: ${request.vehicleTypes.join(', ')}.`);
  parts.push(`₹${request.pricePerHour}/hour` + (request.pricePerDay ? ` · ₹${request.pricePerDay}/day` : '') + '.');
  if (request.hostNotes) parts.push(request.hostNotes);

  const highlights: string[] = [
    `Located in ${request.area}`,
    `${capLabel} parking`,
    `₹${request.pricePerHour}/hour`,
    ...amenityLabels.slice(0, 3),
  ].filter(Boolean);

  return {
    title,
    description: parts.join(' '),
    highlights,
    groundingNote: 'This description was generated from host-provided facts only. No additional claims were added.',
  };
}
