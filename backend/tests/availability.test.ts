import request from 'supertest';
import { app } from '../src/app';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { ParkingListing } from '../src/models/ParkingListing';
import { SlotLock } from '../src/models/SlotLock';

jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/slotLockRepository');

const mockListing: ParkingListing = {
  listingId: 'listing_abc123',
  hostId: 'host_1',
  title: 'Covered Parking Near Forum Mall',
  description: 'Secure covered parking space with CCTV and 24/7 security guard.',
  address: '123, 4th Cross, 5th Block, Koramangala',
  area: 'Koramangala',
  city: 'Bengaluru',
  latitude: 12.9352,
  longitude: 77.6245,
  parkingType: 'COVERED',
  capacity: 2,
  vehicleTypes: ['CAR', 'SUV'],
  pricePerHour: 40,
  amenities: ['covered', 'cctv'],
  photos: [],
  availability: {
    monday: { open: '06:00', close: '23:00' },
    sunday: { open: '08:00', close: '20:00' },
  },
  cancellationPolicy: 'MODERATE',
  rating: 4.5,
  reviewCount: 12,
  status: 'ACTIVE',
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

describe('Availability Service (GET /parking/:id/availability)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
  });

  it('should return operating hours and slots for an open day with no bookings', async () => {
    // 2026-09-21 is a Monday
    const res = await request(app).get('/parking/listing_abc123/availability?date=2026-09-21');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listingId).toBe('listing_abc123');
    expect(res.body.data.date).toBe('2026-09-21');
    expect(res.body.data.capacity).toBe(2);
    expect(res.body.data.operatingHours).toEqual({ open: '06:00', close: '23:00' });
    expect(res.body.data.slots.length).toBeGreaterThan(0);
    expect(res.body.data.slots[0].available).toBe(2);
  });

  it('should calculate accurate available spaces and price estimate when time range is provided', async () => {
    const res = await request(app).get(
      '/parking/listing_abc123/availability?date=2026-09-21&startTime=10:00&endTime=12:00'
    );

    expect(res.status).toBe(200);
    expect(res.body.data.requestedRange).toEqual({
      startTime: '10:00',
      endTime: '12:00',
      isAvailable: true,
      availableSpaces: 2,
    });
    expect(res.body.data.priceEstimate).toBeDefined();
    expect(res.body.data.priceEstimate.durationHours).toBe(2);
    expect(res.body.data.priceEstimate.baseAmount).toBe(80);
    expect(res.body.data.priceEstimate.platformFee).toBe(8);
    expect(res.body.data.priceEstimate.totalAmount).toBe(88);
  });

  it('should account for existing slot locks and reduce available spaces', async () => {
    // Lock slots 20 (10:00) and 21 (10:30)
    const mockLocks: SlotLock[] = [
      {
        listingId: 'listing_abc123',
        slotKey: '2026-09-21#20',
        bookingId: 'booking_1',
        driverId: 'driver_1',
        startTime: '2026-09-21T10:00:00.000Z',
        endTime: '2026-09-21T10:30:00.000Z',
        status: 'BOOKED',
        createdAt: '2026-09-20T00:00:00.000Z',
      },
      {
        listingId: 'listing_abc123',
        slotKey: '2026-09-21#21',
        bookingId: 'booking_1',
        driverId: 'driver_1',
        startTime: '2026-09-21T10:30:00.000Z',
        endTime: '2026-09-21T11:00:00.000Z',
        status: 'BOOKED',
        createdAt: '2026-09-20T00:00:00.000Z',
      },
    ];

    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue(mockLocks);

    const res = await request(app).get(
      '/parking/listing_abc123/availability?date=2026-09-21&startTime=10:00&endTime=12:00'
    );

    expect(res.status).toBe(200);
    expect(res.body.data.requestedRange.isAvailable).toBe(true);
    expect(res.body.data.requestedRange.availableSpaces).toBe(1); // 2 capacity - 1 booked = 1

    // Slot at 10:00 has 1 available
    const slot10 = res.body.data.slots.find((s: any) => s.time === '10:00');
    expect(slot10.available).toBe(1);

    // Slot at 12:00 has 2 available
    const slot12 = res.body.data.slots.find((s: any) => s.time === '12:00');
    expect(slot12.available).toBe(2);
  });

  it('should correctly handle boundary conditions with half-open intervals [start, end)', async () => {
    // Lock slots 20, 21 (10:00 to 11:00) with both spaces taken
    const mockLocks: SlotLock[] = [
      {
        listingId: 'listing_abc123',
        slotKey: '2026-09-21#20#space1',
        bookingId: 'b_1',
        driverId: 'd_1',
        startTime: '2026-09-21T10:00:00.000Z',
        endTime: '2026-09-21T10:30:00.000Z',
        status: 'BOOKED',
        createdAt: '2026-09-20T00:00:00.000Z',
      },
      {
        listingId: 'listing_abc123',
        slotKey: '2026-09-21#20#space2',
        bookingId: 'b_2',
        driverId: 'd_2',
        startTime: '2026-09-21T10:00:00.000Z',
        endTime: '2026-09-21T10:30:00.000Z',
        status: 'BOOKED',
        createdAt: '2026-09-20T00:00:00.000Z',
      },
    ];

    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue(mockLocks);

    // Query 10:00-11:00 -> not available (0 spaces)
    const res1 = await request(app).get(
      '/parking/listing_abc123/availability?date=2026-09-21&startTime=10:00&endTime=11:00'
    );
    expect(res1.body.data.requestedRange.isAvailable).toBe(false);
    expect(res1.body.data.requestedRange.availableSpaces).toBe(0);

    // Abutting query 11:00-12:00 -> fully available (2 spaces)
    const res2 = await request(app).get(
      '/parking/listing_abc123/availability?date=2026-09-21&startTime=11:00&endTime=12:00'
    );
    expect(res2.body.data.requestedRange.isAvailable).toBe(true);
    expect(res2.body.data.requestedRange.availableSpaces).toBe(2);
  });

  it('should return operatingHours: null when closed on requested day', async () => {
    // 2026-09-23 is a Wednesday (not defined in availability)
    const res = await request(app).get('/parking/listing_abc123/availability?date=2026-09-23');

    expect(res.status).toBe(200);
    expect(res.body.data.operatingHours).toBeNull();
    expect(res.body.data.slots).toEqual([]);
  });

  it('should return 400 if date query parameter is missing', async () => {
    const res = await request(app).get('/parking/listing_abc123/availability');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 if listing is not found', async () => {
    (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).get('/parking/non_existent/availability?date=2026-09-21');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PARKING_LISTING_NOT_FOUND');
  });
});
