import request from 'supertest';
import { app } from '../src/app';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { ParkingListing } from '../src/models/ParkingListing';

jest.mock('../src/repositories/parkingRepository');

const mockListings: ParkingListing[] = [
  {
    listingId: 'listing_1',
    hostId: 'host_1',
    title: 'Covered Parking Near Forum Mall',
    description: 'Secure covered space',
    address: '123, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    parkingType: 'COVERED',
    capacity: 2,
    vehicleTypes: ['CAR', 'SUV'],
    pricePerHour: 40,
    amenities: ['covered', 'cctv', 'security'],
    photos: [],
    availability: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
    },
    cancellationPolicy: 'MODERATE',
    rating: 4.8,
    reviewCount: 20,
    status: 'ACTIVE',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    listingId: 'listing_2',
    hostId: 'host_2',
    title: 'Open Parking in Indiranagar',
    description: 'Spacious open driveway',
    address: '456, 100 Feet Rd, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    latitude: 12.9719,
    longitude: 77.6412,
    parkingType: 'OPEN',
    capacity: 1,
    vehicleTypes: ['CAR', 'BIKE'],
    pricePerHour: 25,
    amenities: ['cctv'],
    photos: [],
    availability: {
      monday: { open: '09:00', close: '18:00' },
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.2,
    reviewCount: 5,
    status: 'ACTIVE',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    listingId: 'listing_3',
    hostId: 'host_3',
    title: 'Basement Parking in Whitefield',
    description: 'Basement space in tech park',
    address: 'ITPL Main Rd, Whitefield',
    area: 'Whitefield',
    city: 'Bengaluru',
    latitude: 12.9863,
    longitude: 77.7416,
    parkingType: 'BASEMENT',
    capacity: 4,
    vehicleTypes: ['CAR', 'SUV', 'EV'],
    pricePerHour: 60,
    amenities: ['covered', 'cctv', 'security', 'evCharging'],
    photos: [],
    availability: {
      monday: { open: '00:00', close: '23:59' },
    },
    cancellationPolicy: 'STRICT',
    rating: 4.9,
    reviewCount: 35,
    status: 'ACTIVE',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
];

describe('Parking Search APIs (GET /parking)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.listActive as jest.Mock).mockResolvedValue(mockListings);
    (parkingRepository.findByArea as jest.Mock).mockImplementation(async (area) =>
      mockListings.filter((l) => l.area.toLowerCase() === area.toLowerCase())
    );
    (parkingRepository.findByCity as jest.Mock).mockImplementation(async (city) =>
      mockListings.filter((l) => l.city.toLowerCase() === city.toLowerCase())
    );
    (parkingRepository.findByHostId as jest.Mock).mockImplementation(async (hostId) =>
      mockListings.filter((l) => l.hostId === hostId)
    );
  });

  it('should return all active listings when no search filters are provided', async () => {
    const res = await request(app).get('/parking');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(3);
  });

  it('should filter listings by area', async () => {
    const res = await request(app).get('/parking?area=Koramangala');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].area).toBe('Koramangala');
  });

  it('should filter listings by price range', async () => {
    const res = await request(app).get('/parking?minPrice=30&maxPrice=50');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].listingId).toBe('listing_1');
  });

  it('should filter listings by parking type and vehicle type', async () => {
    const res = await request(app).get('/parking?parkingType=BASEMENT&vehicleType=EV');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].listingId).toBe('listing_3');
  });

  it('should filter listings by amenities', async () => {
    const res = await request(app).get('/parking?amenities=evCharging,security');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].listingId).toBe('listing_3');
  });

  it('should filter listings by minimum rating', async () => {
    const res = await request(app).get('/parking?rating=4.5');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
  });

  it('should calculate distance and filter by geo-radius', async () => {
    // Coordinate near Koramangala (12.9350, 77.6240)
    const res = await request(app).get('/parking?lat=12.9350&lng=77.6240&radius=2');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].listingId).toBe('listing_1');
    expect(res.body.data.items[0].distance).toBeDefined();
    expect(typeof res.body.data.items[0].distance).toBe('number');
  });

  it('should sort listings by price ascending', async () => {
    const res = await request(app).get('/parking?sortBy=price');
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].pricePerHour).toBe(25);
    expect(res.body.data.items[2].pricePerHour).toBe(60);
  });

  it('should sort listings by rating descending', async () => {
    const res = await request(app).get('/parking?sortBy=rating');
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].rating).toBe(4.9);
  });

  it('should filter listings by operating hours for a given date', async () => {
    // 2026-09-21 is a Monday
    // listing_2 is open 09:00 to 18:00
    // Querying for 20:00 to 22:00 should exclude listing_2
    const res = await request(app).get(
      '/parking?date=2026-09-21&startTime=20:00&endTime=22:00'
    );
    expect(res.status).toBe(200);
    const listingIds = res.body.data.items.map((i: any) => i.listingId);
    expect(listingIds).toContain('listing_1');
    expect(listingIds).toContain('listing_3');
    expect(listingIds).not.toContain('listing_2');
  });

  it('should return 400 when invalid query parameters are supplied', async () => {
    const res = await request(app).get('/parking?lat=999');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should include listings with status AVAILABLE (production data compatibility)', async () => {
    const productionListing: any = {
      listingId: 'list_11424333',
      hostId: 'host_demo_1',
      title: 'Prime Downtown Bandra Spot',
      description: 'Covered, secure parking in downtown Bandra.',
      address: '101 Hill Road',
      area: 'Bandra',
      city: 'Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      pricePerHour: 60,
      totalSlots: 3,
      availableSlots: 3,
      status: 'AVAILABLE',
      amenities: {}, // production non-array object
      vehicleTypes: {}, // production non-array object
      createdAt: '2026-09-20T10:30:00.000Z',
      updatedAt: '2026-09-20T10:30:00.000Z',
    };

    (parkingRepository.listActive as jest.Mock).mockResolvedValueOnce([productionListing]);

    const res = await request(app).get('/parking');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].listingId).toBe('list_11424333');
    expect(res.body.data.items[0].title).toBe('Prime Downtown Bandra Spot');
    expect(res.body.data.items[0].city).toBe('Mumbai');
    expect(res.body.data.items[0].area).toBe('Bandra');
    expect(res.body.data.items[0].pricePerHour).toBe(60);
    // Verified defensive normalization
    expect(Array.isArray(res.body.data.items[0].amenities)).toBe(true);
    expect(Array.isArray(res.body.data.items[0].photos)).toBe(true);
    expect(res.body.data.items[0].rating).toBe(0);
    expect(res.body.data.items[0].reviewCount).toBe(0);
    expect(res.body.data.items[0].parkingType).toBe('COVERED');
  });

  it('should find production AVAILABLE listing when searching by city or area', async () => {
    const productionListing: any = {
      listingId: 'list_11424333',
      hostId: 'host_demo_1',
      title: 'Prime Downtown Bandra Spot',
      description: 'Covered, secure parking in downtown Bandra.',
      address: '101 Hill Road',
      area: 'Bandra',
      city: 'Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      pricePerHour: 60,
      status: 'AVAILABLE',
      amenities: {},
      vehicleTypes: {},
      createdAt: '2026-09-20T10:30:00.000Z',
      updatedAt: '2026-09-20T10:30:00.000Z',
    };

    (parkingRepository.findByCity as jest.Mock).mockResolvedValueOnce([productionListing]);
    const resCity = await request(app).get('/parking?city=Mumbai');
    expect(resCity.status).toBe(200);
    expect(resCity.body.data.items.length).toBe(1);
    expect(resCity.body.data.items[0].listingId).toBe('list_11424333');

    (parkingRepository.findByArea as jest.Mock).mockResolvedValueOnce([productionListing]);
    const resArea = await request(app).get('/parking?area=Bandra');
    expect(resArea.status).toBe(200);
    expect(resArea.body.data.items.length).toBe(1);
    expect(resArea.body.data.items[0].listingId).toBe('list_11424333');
  });
});

