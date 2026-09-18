import { apiClient } from './client';
import { Vehicle, CreateVehicleInput } from '../types/vehicle';
import { DEMO_VEHICLES } from './mockData';

const MOCK_STORAGE_KEY = 'parkshare_demo_vehicles';

function getStoredVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock vehicles', e);
  }
  return [...DEMO_VEHICLES];
}

function saveStoredVehicles(vehicles: Vehicle[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving mock vehicles', e);
  }
}

export const vehiclesApi = {
  async list(): Promise<Vehicle[]> {
    try {
      const res = await apiClient.get<Vehicle[]>('/vehicles');
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return getStoredVehicles();
  },

  async getById(id: string): Promise<Vehicle> {
    try {
      const res = await apiClient.get<Vehicle>(`/vehicles/${id}`);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const vehicle = getStoredVehicles().find((v) => v.vehicleId === id);
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  },

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    try {
      const res = await apiClient.post<Vehicle>('/vehicles', input);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const current = getStoredVehicles();
    const newVehicle: Vehicle = {
      vehicleId: `veh_${Date.now().toString(36)}`,
      userId: 'user_driver1',
      vehicleNumber: input.vehicleNumber.toUpperCase(),
      vehicleType: input.vehicleType,
      make: input.make,
      model: input.model,
      color: input.color,
      isDefault: current.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveStoredVehicles([newVehicle, ...current]);
    return newVehicle;
  },

  async update(id: string, input: Partial<CreateVehicleInput>): Promise<Vehicle> {
    try {
      const res = await apiClient.put<Vehicle>(`/vehicles/${id}`, input);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const current = getStoredVehicles();
    const index = current.findIndex((v) => v.vehicleId === id);
    if (index === -1) throw new Error('Vehicle not found');

    const updated = {
      ...current[index],
      ...input,
      updatedAt: new Date().toISOString()
    };
    current[index] = updated;
    saveStoredVehicles(current);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiClient.delete<{ message: string }>(`/vehicles/${id}`);
      if (res.success) return true;
    } catch {
      // Fallback
    }

    const current = getStoredVehicles().filter((v) => v.vehicleId !== id);
    saveStoredVehicles(current);
    return true;
  }
};
