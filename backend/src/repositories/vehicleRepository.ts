import { BaseRepository } from './baseRepository';
import { Vehicle } from '../models/Vehicle';

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles');
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    return this.putItem(vehicle);
  }

  async findById(vehicleId: string): Promise<Vehicle | null> {
    return this.getItem({ vehicleId });
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    return this.queryItems({
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  }

  async update(vehicleId: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    const allowedFields: (keyof Vehicle)[] = ['vehicleNumber', 'vehicleType', 'make', 'model', 'color', 'isDefault'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const placeholder = `:${field}`;
        const nameKey = `#${field}`;
        updateExpressions.push(`${nameKey} = ${placeholder}`);
        expressionAttributeNames[nameKey] = field as string;
        expressionAttributeValues[placeholder] = data[field];
      }
    }

    return this.updateItem(
      { vehicleId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }

  async delete(vehicleId: string): Promise<void> {
    return this.deleteItem({ vehicleId });
  }

  async clearDefault(userId: string): Promise<void> {
    const userVehicles = await this.findByUserId(userId);
    for (const v of userVehicles) {
      if (v.isDefault) {
        await this.update(v.vehicleId, { isDefault: false });
      }
    }
  }
}

export const vehicleRepository = new VehicleRepository();
