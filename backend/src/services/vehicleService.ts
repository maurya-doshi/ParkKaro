import { v4 as uuidv4 } from 'uuid';
import { vehicleRepository } from '../repositories/vehicleRepository';
import { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../models/Vehicle';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class VehicleService {
  /**
   * Create a vehicle for the authenticated user.
   */
  async createVehicle(userId: string, input: CreateVehicleInput): Promise<Vehicle> {
    const vehicleId = `vehicle_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    // If this is the first vehicle or isDefault is requested, clear existing defaults
    const existing = await vehicleRepository.findByUserId(userId);
    const isDefault = existing.length === 0 || (input as any).isDefault === true;

    if (isDefault && existing.length > 0) {
      await vehicleRepository.clearDefault(userId);
    }

    const vehicle: Vehicle = {
      vehicleId,
      userId,
      vehicleNumber: input.vehicleNumber,
      vehicleType: input.vehicleType,
      make: input.make,
      model: input.model,
      color: input.color,
      isDefault,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return vehicleRepository.create(vehicle);
  }

  /**
   * List all vehicles for a user.
   */
  async listVehicles(userId: string): Promise<Vehicle[]> {
    return vehicleRepository.findByUserId(userId);
  }

  /**
   * Get a specific vehicle with ownership check.
   */
  async getVehicle(vehicleId: string, userId: string, userRole: string): Promise<Vehicle> {
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle', vehicleId);
    }

    if (vehicle.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view this vehicle');
    }

    return vehicle;
  }

  /**
   * Update a vehicle with ownership check.
   */
  async updateVehicle(
    vehicleId: string,
    userId: string,
    userRole: string,
    input: UpdateVehicleInput
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicle(vehicleId, userId, userRole);

    // If setting as default, clear other defaults
    if (input.isDefault === true) {
      await vehicleRepository.clearDefault(vehicle.userId);
    }

    const updated = await vehicleRepository.update(vehicleId, input);
    if (!updated) {
      throw new NotFoundError('Vehicle', vehicleId);
    }

    return updated;
  }

  /**
   * Delete a vehicle with ownership check.
   */
  async deleteVehicle(vehicleId: string, userId: string, userRole: string): Promise<void> {
    await this.getVehicle(vehicleId, userId, userRole);
    await vehicleRepository.delete(vehicleId);
  }
}

export const vehicleService = new VehicleService();
