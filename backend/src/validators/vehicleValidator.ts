import { z } from 'zod';

const vehicleTypes = ['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV'] as const;

export const createVehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required').max(20),
  vehicleType: z.enum(vehicleTypes, { errorMap: () => ({ message: 'Invalid vehicle type' }) }),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  color: z.string().min(1, 'Color is required').max(30),
  isDefault: z.boolean().optional(),
});

export const updateVehicleSchema = z.object({
  vehicleNumber: z.string().min(1).max(20).optional(),
  vehicleType: z.enum(vehicleTypes).optional(),
  make: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(30).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateVehicleBody = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleBody = z.infer<typeof updateVehicleSchema>;
