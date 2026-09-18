/**
 * ParkShare AI — Amazon Bedrock Client
 *
 * Wraps the AWS Bedrock Runtime SDK with:
 * - Timeout handling
 * - Error normalisation
 * - Token usage logging
 * - Graceful fallback behaviour
 *
 * Only this file talks to Bedrock. All other AI code calls invokeModel().
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BEDROCK_MODELS, BEDROCK_TIMEOUT_MS } from './models';
import type { BedrockInvokeOptions, BedrockResponse, AIError } from '../types';

// ─── Singleton client ─────────────────────────────────────────────────────────

let _client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!_client) {
    const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-south-1';
    _client = new BedrockRuntimeClient({ region });
  }
  return _client;
}

// ─── Core Invoke ──────────────────────────────────────────────────────────────

/**
 * Calls Amazon Bedrock with the Claude Messages API format.
 *
 * Returns either a BedrockResponse or an AIError.
 * Callers MUST handle the error case — AI failures must never crash the API.
 */
export async function invokeModel(
  opts: BedrockInvokeOptions
): Promise<BedrockResponse | AIError> {
  const {
    modelId,
    systemPrompt,
    userMessage,
    maxTokens = 600,
    temperature = 0.1,
    topP = 0.9,
  } = opts;

  // Build the Anthropic Messages API request body
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens:        maxTokens,
    temperature,
    top_p:             topP,
    system:            systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
    ],
  });

  const command = new InvokeModelCommand({
    modelId,
    body,
    contentType: 'application/json',
    accept:      'application/json',
  });

  // Race against a timeout so slow Bedrock calls don't stall the API
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('BEDROCK_TIMEOUT')), BEDROCK_TIMEOUT_MS)
  );

  try {
    const raw = await Promise.race([getClient().send(command), timeout]);

    // Decode response body
    const responseBody = JSON.parse(new TextDecoder().decode(raw.body));

    // Extract text from Claude's content array
    const content: string =
      responseBody?.content?.[0]?.text ?? '';

    const usage = responseBody?.usage ?? {};

    console.info('[Bedrock] Success', {
      modelId,
      inputTokens:  usage.input_tokens,
      outputTokens: usage.output_tokens,
    });

    return {
      content,
      inputTokens:  usage.input_tokens  ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      stopReason:   responseBody.stop_reason ?? 'end_turn',
    };
  } catch (err: any) {
    console.error('[Bedrock] Error', { modelId, error: err?.message });

    // Map errors to a structured AIError
    if (err?.message === 'BEDROCK_TIMEOUT') {
      return {
        code:                 'TIMEOUT',
        message:              'Bedrock response timed out.',
        fallbackRecommended: true,
      };
    }

    if (err?.name === 'ValidationException') {
      return {
        code:                 'VALIDATION_ERROR',
        message:              `Bedrock validation error: ${err.message}`,
        fallbackRecommended: true,
      };
    }

    return {
      code:                 'BEDROCK_UNAVAILABLE',
      message:              err?.message ?? 'Unknown Bedrock error.',
      fallbackRecommended: true,
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the value is an AIError (not a BedrockResponse). */
export function isAIError(value: BedrockResponse | AIError): value is AIError {
  return 'code' in value && 'fallbackRecommended' in value;
}

/** Parses a JSON string from Bedrock output, with error handling. */
export function parseJSON<T>(raw: string): T | null {
  // Strip markdown code fences if model wrapped the JSON
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('[Bedrock] JSON parse error', { raw: raw.slice(0, 200) });
    return null;
  }
}

/** The primary model to use for all ParkShare AI features. */
export const primaryModel = BEDROCK_MODELS.PRIMARY;
