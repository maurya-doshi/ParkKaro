import { apiClient } from './client';
import { Vehicle, CreateVehicleInput } from '../types/vehicle';

export const vehiclesApi = {
  /**
   * List authenticated user's vehicles (DRIVER)
   * GET /vehicles
   */
  async list(): Promise<Vehicle[]> {
    const res = await apiClient.get<any>('/vehicles');
    if (res && res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.items)) return res.data.items;
    }
    return [];
  },

  /**
   * Get vehicle by ID
   * GET /vehicles/{id}
   */
  async getById(id: string): Promise<Vehicle> {
    const res = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Vehicle '${id}' not found`);
  },

  /**
   * Register a new vehicle
   * POST /vehicles
   */
  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const res = await apiClient.post<Vehicle>('/vehicles', {
      vehicleNumber: input.vehicleNumber.toUpperCase(),
      vehicleType: input.vehicleType,
      make: input.make,
      model: input.model,
      color: input.color
    });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to register vehicle');
  },

  /**
   * Update vehicle
   * PUT /vehicles/{id}
   */
  async update(id: string, input: Partial<CreateVehicleInput>): Promise<Vehicle> {
    const res = await apiClient.put<Vehicle>(`/vehicles/${id}`, input);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to update vehicle '${id}'`);
  },

  /**
   * Delete vehicle
   * DELETE /vehicles/{id}
   */
  async delete(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ message: string }>(`/vehicles/${id}`);
    return !!res?.success;
  }
};
