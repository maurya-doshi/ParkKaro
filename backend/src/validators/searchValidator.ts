import { z } from 'zod';

export const searchParkingSchema = z.object({
  area: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().default(5).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)').optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  parkingType: z.enum(['OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL']).optional(),
  vehicleType: z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']).optional(),
  amenities: z.string().optional(), // Comma-separated
  rating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(['price', 'rating', 'distance']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  nextToken: z.string().optional(),
  hostId: z.string().optional(),
});

export type SearchParkingParams = z.infer<typeof searchParkingSchema>;
