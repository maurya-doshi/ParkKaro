import request from 'supertest';
import { app } from '../src/app';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { ParkingListing } from '../src/models/ParkingListing';
import { Booking } from '../src/models/Booking';

jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/paymentRepository');

const mockListing: ParkingListing = {
  listingId: 'listing_123',
  hostId: 'host_1',
  title: 'Covered Parking Space',
  description: 'Near metro station',
  address: 'Indiranagar 100ft Rd',
  area: 'Indiranagar',
  city: 'Bengaluru',
  latitude: 12.9719,
  longitude: 77.6412,
  parkingType: 'COVERED',
  capacity: 2,
  vehicleTypes: ['CAR', 'SUV'],
  pricePerHour: 50,
  amenities: ['covered', 'cctv'],
  photos: [],
  availability: {
    monday: { open: '06:00', close: '23:00' },
  },
  cancellationPolicy: 'MODERATE',
  rating: 4.8,
  reviewCount: 15,
  status: 'ACTIVE',
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

const mockBooking: Booking = {
  bookingId: 'booking_456',
  listingId: 'listing_123',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_1',
  startTime: '2026-09-21T10:00:00.000Z',
  endTime: '2026-09-21T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 100,
  platformFee: 10,
  tax: 0,
  totalAmount: 110,
  hostEarnings: 90,
  paymentStatus: 'PENDING',
  bookingStatus: 'CONFIRMED',
  qrData: 'eyJib29ra...',
  qrVerificationCode: 'A1B2C3D4',
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
};

describe('Booking Flow APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);
    (bookingRepository.create as jest.Mock).mockImplementation(async (b) => b);
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValue(true);
    (slotLockRepository.releaseLocks as jest.Mock).mockResolvedValue(undefined);
    (paymentRepository.create as jest.Mock).mockResolvedValue({} as any);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  describe('POST /bookings', () => {
    const validBookingPayload = {
      listingId: 'listing_123',
      vehicleId: 'vehicle_1',
      date: '2026-09-21', // Monday
      startTime: '10:00',
      endTime: '12:00',
    };

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/bookings').send(validBookingPayload);
      expect(res.status).toBe(401);
    });

    it('should return 403 when authenticated as a HOST', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send(validBookingPayload);

      expect(res.status).toBe(403);
    });

    it('should create booking and calculate pricing breakdown for DRIVER', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validBookingPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingId).toBeDefined();
      expect(res.body.data.driverId).toBe('driver_1');
      expect(res.body.data.durationHours).toBe(2);
      expect(res.body.data.baseAmount).toBe(100);
      expect(res.body.data.platformFee).toBe(10);
      expect(res.body.data.totalAmount).toBe(110);
      expect(res.body.data.hostEarnings).toBe(90);
      expect(res.body.data.bookingStatus).toBe('CONFIRMED');
      expect(res.body.data.qrVerificationCode).toBeDefined();
      expect(slotLockRepository.acquireLocks).toHaveBeenCalledTimes(1);
    });

    it('should return 409 BOOKING_CONFLICT when slots are already booked', async () => {
      (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/bookings')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validBookingPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BOOKING_CONFLICT');
    });

    it('should return 400 when start time >= end time', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({
          ...validBookingPayload,
          startTime: '14:00',
          endTime: '12:00',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /bookings', () => {
    it('should list bookings for authenticated driver', async () => {
      (bookingRepository.findByDriverId as jest.Mock).mockResolvedValue([mockBooking]);

      const res = await request(app)
        .get('/bookings')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].bookingId).toBe('booking_456');
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return booking when requested by the driver', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

      const res = await request(app)
        .get('/bookings/booking_456')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.bookingId).toBe('booking_456');
    });

    it('should return 403 when requested by an unrelated user', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

      const res = await request(app)
        .get('/bookings/booking_456')
        .set('x-demo-user-id', 'unrelated_user')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });
  });

  describe('POST /bookings/:id/cancel', () => {
    it('should cancel booking and refund amount', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        bookingStatus: 'CANCELLED',
      });

      const res = await request(app)
        .post('/bookings/booking_456/cancel')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ reason: 'Plans changed' });

      expect(res.status).toBe(200);
      expect(res.body.data.bookingStatus).toBe('CANCELLED');
      expect(res.body.data.paymentStatus).toBe('REFUNDED');
      expect(res.body.data.refundAmount).toBe(110);
      expect(slotLockRepository.releaseLocks).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /bookings/:id/complete', () => {
    it('should complete booking when called by the host', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        bookingStatus: 'COMPLETED',
      });

      const res = await request(app)
        .post('/bookings/booking_456/complete')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.data.bookingStatus).toBe('COMPLETED');
    });
  });

  describe('POST /bookings/:id/verify-qr', () => {
    it('should activate booking on QR verification by host', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        bookingStatus: 'ACTIVE',
      });

      const res = await request(app)
        .post('/bookings/booking_456/verify-qr')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ verificationCode: 'A1B2C3D4' });

      expect(res.status).toBe(200);
      expect(res.body.data.bookingStatus).toBe('ACTIVE');
    });
  });
});
