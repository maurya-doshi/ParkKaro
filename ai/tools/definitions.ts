/**
 * ParkKaro AI — Tool / Function Definitions
 *
 * If the selected Bedrock model supports tool use (function calling),
 * these definitions describe the controlled backend functions the AI
 * is allowed to request structured data from.
 *
 * IMPORTANT: The AI never accesses the database directly.
 * Tool calls are intercepted by the backend, which fetches real data
 * and returns it to the AI. This is a strict sandboxing layer.
 *
 * Currently: Tools are defined here for documentation and future use.
 * Claude Haiku v3 supports tool use via the Messages API.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool: searchParking
 * Allows the AI to request a structured search of parking listings.
 * Backend executes the actual DynamoDB query.
 */
export const searchParkingTool: ToolDefinition = {
  name: 'searchParking',
  description:
    'Search for available parking listings using structured filters. ' +
    'Returns real listings from the backend. Never returns invented data.',
  input_schema: {
    type: 'object',
    properties: {
      area:        { type: 'string',  description: 'Neighbourhood or area name (e.g. Koramangala)' },
      city:        { type: 'string',  description: 'City name (e.g. Bengaluru)' },
      date:        { type: 'string',  description: 'Date in YYYY-MM-DD format' },
      startTime:   { type: 'string',  description: 'Start time in HH:mm (24-hour) format' },
      endTime:     { type: 'string',  description: 'End time in HH:mm (24-hour) format' },
      maxPrice:    { type: 'number',  description: 'Maximum price per hour in INR' },
      parkingType: {
        type: 'string',
        enum: ['OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL'],
        description: 'Type of parking',
      },
      vehicleType: {
        type: 'string',
        enum: ['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV'],
        description: 'Type of vehicle',
      },
      amenities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required amenities (e.g. ["cctv", "evCharging"])',
      },
    },
    required: [],
  },
};

/**
 * Tool: getParkingDetails
 * Allows the AI to request full details of a specific listing.
 */
export const getParkingDetailsTool: ToolDefinition = {
  name: 'getParkingDetails',
  description:
    'Get full details of a specific parking listing by ID. ' +
    'Returns real data from the backend.',
  input_schema: {
    type: 'object',
    properties: {
      listingId: { type: 'string', description: 'The parking listing ID' },
    },
    required: ['listingId'],
  },
};

/**
 * Tool: checkAvailability
 * Allows the AI to request availability information for a specific listing.
 */
export const checkAvailabilityTool: ToolDefinition = {
  name: 'checkAvailability',
  description:
    'Check availability of a parking listing for a specific date and time range. ' +
    'Returns real availability data from the backend.',
  input_schema: {
    type: 'object',
    properties: {
      listingId:  { type: 'string', description: 'The parking listing ID' },
      date:       { type: 'string', description: 'Date in YYYY-MM-DD format' },
      startTime:  { type: 'string', description: 'Start time in HH:mm format' },
      endTime:    { type: 'string', description: 'End time in HH:mm format' },
    },
    required: ['listingId', 'date'],
  },
};

/**
 * Tool: getPricingContext
 * Allows the AI to request market pricing context for a given area.
 */
export const getPricingContextTool: ToolDefinition = {
  name: 'getPricingContext',
  description:
    'Get market pricing context for a given area and parking type. ' +
    'Returns comparable listings and area average prices from the backend.',
  input_schema: {
    type: 'object',
    properties: {
      area:        { type: 'string', description: 'Neighbourhood or area name' },
      parkingType: { type: 'string', description: 'Type of parking space' },
    },
    required: ['area'],
  },
};

/** All tools available to the AI model. */
export const ALL_TOOLS: ToolDefinition[] = [
  searchParkingTool,
  getParkingDetailsTool,
  checkAvailabilityTool,
  getPricingContextTool,
];
