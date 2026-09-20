/**
 * Vehicle model — corresponds to parkkaro-vehicles table.
 */

export type VehicleType = 'CAR' | 'BIKE' | 'SUV' | 'TRUCK' | 'EV';

export interface Vehicle {
  vehicleId: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  color: string;
}

export interface UpdateVehicleInput {
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  isDefault?: boolean;
}
