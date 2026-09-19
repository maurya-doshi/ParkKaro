import { BaseRepository } from './baseRepository';
import { ParkingListing, ListingStatus } from '../models/ParkingListing';

export class ParkingRepository extends BaseRepository<ParkingListing> {
  constructor() {
    super('parking');
  }

  async create(listing: ParkingListing): Promise<ParkingListing> {
    return this.putItem(listing);
  }

  async findById(listingId: string): Promise<ParkingListing | null> {
    return this.getItem({ listingId });
  }

  async findByHostId(hostId: string): Promise<ParkingListing[]> {
    return this.queryItems({
      IndexName: 'hostId-index',
      KeyConditionExpression: 'hostId = :hostId',
      ExpressionAttributeValues: {
        ':hostId': hostId,
      },
    });
  }

  async findByArea(area: string, maxPrice?: number): Promise<ParkingListing[]> {
    if (maxPrice !== undefined) {
      return this.queryItems({
        IndexName: 'area-price-index',
        KeyConditionExpression: 'area = :area AND pricePerHour <= :maxPrice',
        ExpressionAttributeValues: {
          ':area': area,
          ':maxPrice': maxPrice,
        },
      });
    }

    return this.queryItems({
      IndexName: 'area-price-index',
      KeyConditionExpression: 'area = :area',
      ExpressionAttributeValues: {
        ':area': area,
      },
    });
  }

  async findByCity(city: string): Promise<ParkingListing[]> {
    return this.queryItems({
      IndexName: 'city-index',
      KeyConditionExpression: 'city = :city',
      ExpressionAttributeValues: {
        ':city': city,
      },
    });
  }

  async listActive(limit = 50): Promise<ParkingListing[]> {
    return this.queryItems({
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'ACTIVE',
      },
      Limit: limit,
    });
  }

  async update(listingId: string, data: Partial<ParkingListing>): Promise<ParkingListing | null> {
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    const allowedFields: (keyof ParkingListing)[] = [
      'title',
      'description',
      'address',
      'area',
      'city',
      'latitude',
      'longitude',
      'parkingType',
      'capacity',
      'vehicleTypes',
      'pricePerHour',
      'pricePerDay',
      'monthlyPrice',
      'amenities',
      'photos',
      'availability',
      'bookingSettings',
      'cancellationPolicy',
      'status',
    ];

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
      { listingId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }

  async delete(listingId: string): Promise<void> {
    return this.deleteItem({ listingId });
  }

  async updateStatus(listingId: string, status: ListingStatus): Promise<ParkingListing | null> {
    return this.update(listingId, { status });
  }

  async updateRating(listingId: string, rating: number, reviewCount: number): Promise<void> {
    await this.updateItem(
      { listingId },
      'SET #rating = :rating, #reviewCount = :reviewCount, #updatedAt = :updatedAt',
      {
        '#rating': 'rating',
        '#reviewCount': 'reviewCount',
        '#updatedAt': 'updatedAt',
      },
      {
        ':rating': rating,
        ':reviewCount': reviewCount,
        ':updatedAt': new Date().toISOString(),
      }
    );
  }

  async listAll(limit = 100): Promise<ParkingListing[]> {
    return this.scanItems({ Limit: limit });
  }
}

export const parkingRepository = new ParkingRepository();
