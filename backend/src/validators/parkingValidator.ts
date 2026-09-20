import { z } from 'zod';

const dayAvailabilitySchema = z
  .object({
    open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
    close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  })
  .optional();

const weeklyAvailabilitySchema = z.object({
  monday: dayAvailabilitySchema,
  tuesday: dayAvailabilitySchema,
  wednesday: dayAvailabilitySchema,
  thursday: dayAvailabilitySchema,
  friday: dayAvailabilitySchema,
  saturday: dayAvailabilitySchema,
  sunday: dayAvailabilitySchema,
});

const bookingSettingsSchema = z
  .object({
    minDurationHours: z.number().min(0.5).optional(),
    maxDurationHours: z.number().min(0.5).optional(),
    advanceBookingDays: z.number().min(1).optional(),
    instantBooking: z.boolean().optional(),
  })
  .optional();

export const createParkingListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  address: z.string().min(5, 'Address must be at least 5 characters').max(300),
  area: z.string().min(2, 'Area must be at least 2 characters').max(100),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  parkingType: z.enum(['OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL']),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(1000),
  vehicleTypes: z
    .array(z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']))
    .min(1, 'At least one vehicle type required'),
  pricePerHour: z.number().min(0, 'Price per hour cannot be negative'),
  pricePerDay: z.number().min(0).optional(),
  monthlyPrice: z.number().min(0).optional(),
  amenities: z
    .array(z.enum(['covered', 'cctv', 'security', 'lighting', 'evCharging', 'accessible', '24x7']))
    .default([]),
  photos: z.array(z.string()).default([]),
  availability: weeklyAvailabilitySchema.default({}),
  bookingSettings: bookingSettingsSchema,
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).default('MODERATE'),
});

export const updateParkingListingSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(10).max(2000).optional(),
  address: z.string().min(5).max(300).optional(),
  area: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  parkingType: z.enum(['OPEN', 'COVERED', 'BASEMENT', 'GARAGE', 'PRIVATE', 'COMMERCIAL']).optional(),
  capacity: z.number().int().min(1).max(1000).optional(),
  vehicleTypes: z.array(z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV'])).min(1).optional(),
  pricePerHour: z.number().min(0).optional(),
  pricePerDay: z.number().min(0).optional(),
  monthlyPrice: z.number().min(0).optional(),
  amenities: z
    .array(z.enum(['covered', 'cctv', 'security', 'lighting', 'evCharging', 'accessible', '24x7']))
    .optional(),
  photos: z.array(z.string()).optional(),
  availability: weeklyAvailabilitySchema.optional(),
  bookingSettings: bookingSettingsSchema,
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'AVAILABLE']),
});
