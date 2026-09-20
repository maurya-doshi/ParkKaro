import { VehicleType } from './parking';
export type { VehicleType };

export interface Vehicle {
  vehicleId: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  color: string;
  isDefault?: boolean;
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
