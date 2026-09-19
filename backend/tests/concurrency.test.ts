/**
 * Concurrency Tests — Commit 12
 *
 * Verifies that the atomic slot-lock system prevents double-booking
 * even when two concurrent requests attempt to book the same slot.
 */
import request from 'supertest';
import { app } from '../src/app';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { ParkingListing } from '../src/models/ParkingListing';

jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/paymentRepository');

const listing: ParkingListing = {
  listingId: 'listing_conc',
  hostId: 'host_conc',
  title: 'Concurrency Test Spot',
  description: 'Testing double-booking prevention',
  address: '123 Concurrent Rd',
  area: 'TestArea',
  city: 'Bengaluru',
  latitude: 12.97,
  longitude: 77.64,
  parkingType: 'COVERED',
  capacity: 1, // Only 1 space — forces contention
  vehicleTypes: ['CAR'],
  pricePerHour: 40,
  amenities: [],
  photos: [],
  availability: {
    monday: { open: '06:00', close: '22:00' },
    tuesday: { open: '06:00', close: '22:00' },
    wednesday: { open: '06:00', close: '22:00' },
    thursday: { open: '06:00', close: '22:00' },
    friday: { open: '06:00', close: '22:00' },
    saturday: { open: '06:00', close: '22:00' },
    sunday: { open: '06:00', close: '22:00' },
  },
  cancellationPolicy: 'MODERATE',
  rating: 0,
  reviewCount: 0,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const bookingPayload = {
  listingId: 'listing_conc',
  vehicleId: 'vehicle_conc',
  date: '2026-09-21', // Monday
  startTime: '10:00',
  endTime: '12:00',
};

const demoHeaders = (userId: string) => ({
  'x-demo-user-id': userId,
  'x-demo-role': 'DRIVER',
});

describe('Concurrency — Double-Booking Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(listing);
    (bookingRepository.create as jest.Mock).mockImplementation(async (b) => b);
    (paymentRepository.create as jest.Mock).mockResolvedValue({} as any);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
  });

  it('should allow only one booking when two concurrent requests target the same single-capacity slot', async () => {
    // First call succeeds; second call to acquireLocks fails (simulating TransactionCanceledException)
    let callCount = 0;
    (slotLockRepository.acquireLocks as jest.Mock).mockImplementation(async () => {
      callCount++;
      // Simulate latency and atomic check: first call succeeds, second fails
      if (callCount === 1) return true;
      return false;
    });

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/bookings')
        .set(demoHeaders('driver_a'))
        .send(bookingPayload),
      request(app)
        .post('/bookings')
        .set(demoHeaders('driver_b'))
        .send(bookingPayload),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One should succeed (201), one should fail (409 BOOKING_CONFLICT)
    expect(statuses).toEqual([201, 409]);

    const successRes = res1.status === 201 ? res1 : res2;
    const failRes = res1.status === 409 ? res1 : res2;

    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.bookingId).toBeDefined();

    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error.code).toBe('BOOKING_CONFLICT');
  });

  it('should both succeed when acquireLocks atomically allows both (multi-capacity)', async () => {
    // Simulate capacity=2: both locks succeed
    const multiCapListing = { ...listing, capacity: 2 };
    (parkingRepository.findById as jest.Mock).mockResolvedValue(multiCapListing);
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValue(true);

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/bookings')
        .set(demoHeaders('driver_a'))
        .send(bookingPayload),
      request(app)
        .post('/bookings')
        .set(demoHeaders('driver_b'))
        .send(bookingPayload),
    ]);

    // Both should succeed
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });

  it('should reject all three when capacity is fully locked', async () => {
    // All slots locked
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValue(false);
    // Pre-fill existing locks so assigned space search fails
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([
      { listingId: 'listing_conc', slotKey: '2026-09-21#20#space1', status: 'BOOKED', bookingId: 'prev' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#21#space1', status: 'BOOKED', bookingId: 'prev' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#22#space1', status: 'BOOKED', bookingId: 'prev' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#23#space1', status: 'BOOKED', bookingId: 'prev' },
    ]);

    const [res1, res2, res3] = await Promise.all([
      request(app).post('/bookings').set(demoHeaders('d1')).send(bookingPayload),
      request(app).post('/bookings').set(demoHeaders('d2')).send(bookingPayload),
      request(app).post('/bookings').set(demoHeaders('d3')).send(bookingPayload),
    ]);

    expect(res1.status).toBe(409);
    expect(res2.status).toBe(409);
    expect(res3.status).toBe(409);
  });

  it('should succeed after a previously locked slot is released', async () => {
    // First: locks held, request fails
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValueOnce([
      { listingId: 'listing_conc', slotKey: '2026-09-21#20#space1', status: 'BOOKED', bookingId: 'old' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#21#space1', status: 'BOOKED', bookingId: 'old' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#22#space1', status: 'BOOKED', bookingId: 'old' },
      { listingId: 'listing_conc', slotKey: '2026-09-21#23#space1', status: 'BOOKED', bookingId: 'old' },
    ]);

    const fail = await request(app)
      .post('/bookings')
      .set(demoHeaders('driver_retry'))
      .send(bookingPayload);
    expect(fail.status).toBe(409);

    // Now: locks released, request succeeds
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValueOnce([
      { listingId: 'listing_conc', slotKey: '2026-09-21#20#space1', status: 'RELEASED', bookingId: 'old' },
    ]);
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValueOnce(true);

    const success = await request(app)
      .post('/bookings')
      .set(demoHeaders('driver_retry'))
      .send(bookingPayload);
    expect(success.status).toBe(201);
  });
});
