/**
 * ParkShare AI — Feature: Listing Description Generator
 *
 * POST /ai/listing-description
 *
 * Flow:
 * 1. Host provides structured facts about their parking spot
 * 2. This module calls Bedrock to generate a professional description
 * 3. Grounding validator checks for potentially hallucinated claims
 * 4. Output is returned to the host for review (not auto-published)
 *
 * Grounding guarantee:
 * - AI only describes facts explicitly provided by the host
 * - AI does NOT add: CCTV, security, EV charging, covered, distance claims,
 *   or any neighbourhood assertions not stated by the host
 * - Grounding validator flags suspicious patterns for monitoring
 * - Output always includes a note confirming no facts were added
 */

import { invokeModel, isAIError, parseJSON, primaryModel } from '../bedrock/client';
import {
  DESCRIPTION_SYSTEM_PROMPT,
  buildDescriptionUserPrompt,
} from '../bedrock/prompts';
import { groundDescription } from '../grounding/validator';
import { TOKEN_LIMITS, MODEL_PARAMS } from '../bedrock/models';
import type {
  ListingDescriptionRequest,
  ListingDescriptionResult,
  AIError,
} from '../types';

/** Map of parkingType codes to human-readable labels for the Indian market. */
const PARKING_TYPE_LABELS: Record<string, string> = {
  OPEN:       'open-air',
  COVERED:    'covered',
  BASEMENT:   'basement',
  GARAGE:     'garage',
  PRIVATE:    'private',
  COMMERCIAL: 'commercial',
};

/** Friendly amenity labels for Indian parking market. */
const AMENITY_LABELS: Record<string, string> = {
  covered:     'covered parking',
  cctv:        'CCTV surveillance',
  security:    '24/7 security',
  lighting:    'well-lit',
  evCharging:  'EV charging',
  accessible:  'wheelchair accessible',
  '24x7':      '24/7 access',
};

/**
 * Generate a listing title and description from host-provided facts.
 *
 * @param request - Host-provided facts (no AI assumptions allowed)
 * @returns ListingDescriptionResult or AIError
 */
export async function generateListingDescription(
  request: ListingDescriptionRequest
): Promise<ListingDescriptionResult | AIError> {
  // Build a human-readable facts object for the prompt
  const facts: Record<string, unknown> = {
    area:         request.area,
    city:         request.city || 'Bengaluru',
    parkingType:  PARKING_TYPE_LABELS[request.parkingType] ?? request.parkingType,
    capacity:     request.capacity ? `${request.capacity} space(s)` : undefined,
    vehicleTypes: request.vehicleTypes?.join(', '),
    amenities:    request.amenities
                    .map(a => AMENITY_LABELS[a] ?? a)
                    .join(', ') || 'None specified',
    pricePerHour: `₹${request.pricePerHour}/hour`,
    pricePerDay:  request.pricePerDay ? `₹${request.pricePerDay}/day` : undefined,
    hostNotes:    request.hostNotes || undefined,
  };

  // Remove undefined values
  Object.keys(facts).forEach(k => facts[k] === undefined && delete facts[k]);

  const result = await invokeModel({
    modelId:     primaryModel,
    systemPrompt: DESCRIPTION_SYSTEM_PROMPT,
    userMessage:  buildDescriptionUserPrompt(facts),
    maxTokens:    TOKEN_LIMITS.DESCRIPTION,
    ...MODEL_PARAMS.NATURAL,
  });

  if (isAIError(result)) {
    // Return a simple template-based description if Bedrock fails
    return fallbackDescription(request);
  }

  const parsed = parseJSON<Partial<ListingDescriptionResult>>(result.content);

  if (!parsed) {
    return fallbackDescription(request);
  }

  return groundDescription(parsed, request.amenities);
}

/**
 * Fallback description when Bedrock is unavailable.
 * Template-based — only uses facts provided by the host.
 */
function fallbackDescription(
  request: ListingDescriptionRequest
): ListingDescriptionResult {
  const typeLabel = PARKING_TYPE_LABELS[request.parkingType] ?? request.parkingType;
  const amenityLabels = request.amenities.map(a => AMENITY_LABELS[a] ?? a);

  const title = [
    typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1),
    'Parking in',
    request.area,
  ].join(' ');

  const amenityText = amenityLabels.length > 0
    ? ` Features include: ${amenityLabels.join(', ')}.`
    : '';

  const vehicleText = request.vehicleTypes?.length
    ? ` Suitable for ${request.vehicleTypes.join(', ')}.`
    : '';

  const description = [
    `Parking space available in ${request.area}.`,
    amenityText,
    vehicleText,
    `Priced at ₹${request.pricePerHour}/hour.`,
    request.hostNotes ? request.hostNotes : '',
  ].filter(Boolean).join(' ').trim();

  const highlights: string[] = [
    `Located in ${request.area}`,
    `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} parking`,
    `₹${request.pricePerHour}/hour`,
    ...amenityLabels.slice(0, 2),
  ].filter(Boolean);

  return {
    title,
    description,
    highlights,
    groundingNote: 'This description was generated from host-provided facts only. No additional claims were added.',
  };
}
