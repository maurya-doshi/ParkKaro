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
    try {
      const items = await this.queryItems({
        IndexName: 'hostId-index',
        KeyConditionExpression: 'hostId = :hostId',
        ExpressionAttributeValues: {
          ':hostId': hostId,
        },
      });
      if (items.length > 0) return items;
    } catch {
      // GSI query failed or index unavailable, fall through
    }

    const all = await this.scanItems();
    return all.filter((item) => item.hostId === hostId);
  }

  async findByArea(area: string, maxPrice?: number): Promise<ParkingListing[]> {
    try {
      let items: ParkingListing[];
      if (maxPrice !== undefined) {
        items = await this.queryItems({
          IndexName: 'area-price-index',
          KeyConditionExpression: 'area = :area AND pricePerHour <= :maxPrice',
          ExpressionAttributeValues: {
            ':area': area,
            ':maxPrice': maxPrice,
          },
        });
      } else {
        items = await this.queryItems({
          IndexName: 'area-price-index',
          KeyConditionExpression: 'area = :area',
          ExpressionAttributeValues: {
            ':area': area,
          },
        });
      }
      if (items.length > 0) return items;
    } catch {
      // GSI query failed or index unavailable, fall through
    }

    // Fallback: scan with case-insensitive area match
    const all = await this.scanItems();
    const areaLower = area.toLowerCase();
    return all.filter((item) => {
      const matchesArea = (item.area || '').toLowerCase().includes(areaLower);
      const matchesPrice = maxPrice !== undefined ? item.pricePerHour <= maxPrice : true;
      return matchesArea && matchesPrice;
    });
  }

  async findByCity(city: string): Promise<ParkingListing[]> {
    try {
      const items = await this.queryItems({
        IndexName: 'city-index',
        KeyConditionExpression: 'city = :city',
        ExpressionAttributeValues: {
          ':city': city,
        },
      });
      if (items.length > 0) return items;
    } catch {
      // GSI query failed or index unavailable, fall through
    }

    // Fallback: scan with case-insensitive city match
    const all = await this.scanItems();
    const cityLower = city.toLowerCase();
    return all.filter((item) => (item.city || '').toLowerCase() === cityLower);
  }

  async listActive(limit = 50): Promise<ParkingListing[]> {
    try {
      // Query both ACTIVE and AVAILABLE statuses (supports production and seed data)
      const activePromise = this.queryItems({
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'ACTIVE',
        },
        Limit: limit,
      }).catch(() => [] as ParkingListing[]);

      const availablePromise = this.queryItems({
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'AVAILABLE',
        },
        Limit: limit,
      }).catch(() => [] as ParkingListing[]);

      const [activeItems, availableItems] = await Promise.all([activePromise, availablePromise]);
      const combined = [...activeItems, ...availableItems];

      if (combined.length > 0) {
        const seen = new Set<string>();
        const unique: ParkingListing[] = [];
        for (const item of combined) {
          if (!seen.has(item.listingId)) {
            seen.add(item.listingId);
            unique.push(item);
          }
        }
        return unique.slice(0, limit);
      }

      // Fallback: scan table if GSI returned no items or is unindexed
      const scanned = await this.scanItems({ Limit: limit });
      return scanned
        .filter((item) => {
          const s = (item.status || '').toUpperCase();
          return s === 'ACTIVE' || s === 'AVAILABLE' || !item.status;
        })
        .slice(0, limit);
    } catch {
      const scanned = await this.scanItems({ Limit: limit }).catch(() => [] as ParkingListing[]);
      return scanned
        .filter((item) => {
          const s = (item.status || '').toUpperCase();
          return s === 'ACTIVE' || s === 'AVAILABLE' || !item.status;
        })
        .slice(0, limit);
    }
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
