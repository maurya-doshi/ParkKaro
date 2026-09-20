/**
 * Validation Hardening Tests — Commit 12
 *
 * Tests boundary conditions, malformed inputs, negative values, invalid dates,
 * payment state machine transitions, pricing edge cases, and search consistency.
 */
import request from 'supertest';
import { app } from '../src/app';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { vehicleRepository } from '../src/repositories/vehicleRepository';
import { reviewRepository } from '../src/repositories/reviewRepository';
import { favoriteRepository } from '../src/repositories/favoriteRepository';
import { paymentService } from '../src/services/paymentService';
import { calculatePrice } from '../src/utils/pricing';
import { durationInHours, timeRangesOverlap } from '../src/utils/dates';
import { getTimeSlotsForRange, timeToSlotIndex } from '../src/utils/slots';
import { Booking } from '../src/models/Booking';
import { Payment } from '../src/models/Payment';

jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/reviewRepository');
jest.mock('../src/repositories/favoriteRepository');

const DRIVER = 'driver_valid';
const HOST = 'host_valid';

function asDriver(userId = DRIVER) {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'DRIVER' };
}
function asHost(userId = HOST) {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'HOST' };
}

// ─── Pricing Engine Unit Tests ──────────────────────────────────────────────

describe('Validation — Pricing engine boundary checks', () => {
  it('should throw on zero-duration booking', () => {
    const t = '2026-09-21T10:00:00.000Z';
    expect(() => calculatePrice(50, t, t)).toThrow();
  });

  it('should throw when end time is before start time', () => {
    expect(() =>
      calculatePrice(50, '2026-09-21T12:00:00.000Z', '2026-09-21T10:00:00.000Z')
    ).toThrow();
  });

  it('should compute correct price for 1-hour slot at 50/hr (10% commission, 0% tax)', () => {
    const result = calculatePrice(50, '2026-09-21T10:00:00.000Z', '2026-09-21T11:00:00.000Z');
    expect(result.durationHours).toBe(1);
    expect(result.baseAmount).toBe(50);
    expect(result.platformFee).toBe(5);   // 10%
    expect(result.tax).toBe(0);
    expect(result.totalAmount).toBe(55);
  });

  it('should round up to nearest 0.5h for fractional durations (35min → 1h billed)', () => {
    const result = calculatePrice(
      60,
      '2026-09-21T10:00:00.000Z',
      '2026-09-21T10:35:00.000Z'
    );
    expect(result.durationHours).toBe(1); // 35min rounds up to 1h
    expect(result.baseAmount).toBe(60);
  });

  it('should handle minimum price per hour of 0 (free parking)', () => {
    const result = calculatePrice(0, '2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z');
    expect(result.baseAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('should compute platform fee correctly for large amount', () => {
    const result = calculatePrice(5000, '2026-09-21T08:00:00.000Z', '2026-09-21T20:00:00.000Z');
    expect(result.durationHours).toBe(12);
    expect(result.baseAmount).toBe(60000);
    expect(result.platformFee).toBeCloseTo(6000, 1);
  });
});

// ─── Date Utility Tests ─────────────────────────────────────────────────────

describe('Validation — Date utilities', () => {
  it('durationInHours: correctly calculates 2 hours', () => {
    expect(durationInHours('2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z')).toBe(2);
  });

  it('durationInHours: returns negative for inverted range', () => {
    expect(durationInHours('2026-09-21T12:00:00.000Z', '2026-09-21T10:00:00.000Z')).toBe(-2);
  });

  it('timeRangesOverlap: overlapping ranges return true', () => {
    expect(timeRangesOverlap(
      '2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z',
      '2026-09-21T11:00:00.000Z', '2026-09-21T13:00:00.000Z'
    )).toBe(true);
  });

  it('timeRangesOverlap: adjacent (abutting) ranges do NOT overlap', () => {
    expect(timeRangesOverlap(
      '2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z',
      '2026-09-21T12:00:00.000Z', '2026-09-21T14:00:00.000Z'
    )).toBe(false);
  });

  it('timeRangesOverlap: non-overlapping ranges return false', () => {
    expect(timeRangesOverlap(
      '2026-09-21T08:00:00.000Z', '2026-09-21T10:00:00.000Z',
      '2026-09-21T14:00:00.000Z', '2026-09-21T16:00:00.000Z'
    )).toBe(false);
  });

  it('timeRangesOverlap: contained range overlaps', () => {
    expect(timeRangesOverlap(
      '2026-09-21T08:00:00.000Z', '2026-09-21T20:00:00.000Z',
      '2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z'
    )).toBe(true);
  });
});

// ─── Slot Utility Tests ─────────────────────────────────────────────────────

describe('Validation — Slot utilities', () => {
  it('timeToSlotIndex: 00:00 → 0', () => expect(timeToSlotIndex('00:00')).toBe(0));
  it('timeToSlotIndex: 00:30 → 1', () => expect(timeToSlotIndex('00:30')).toBe(1));
  it('timeToSlotIndex: 10:00 → 20', () => expect(timeToSlotIndex('10:00')).toBe(20));
  it('timeToSlotIndex: 10:30 → 21', () => expect(timeToSlotIndex('10:30')).toBe(21));
  it('timeToSlotIndex: 23:30 → 47', () => expect(timeToSlotIndex('23:30')).toBe(47));

  it('getTimeSlotsForRange: 10:00-12:00 produces 4 slots', () => {
    const slots = getTimeSlotsForRange('2026-09-21', '10:00', '12:00');
    expect(slots).toHaveLength(4);
    expect(slots[0].slotKey).toBe('2026-09-21#20');
    expect(slots[3].slotKey).toBe('2026-09-21#23');
  });

  it('getTimeSlotsForRange: same start and end produces 0 slots', () => {
    const slots = getTimeSlotsForRange('2026-09-21', '10:00', '10:00');
    expect(slots).toHaveLength(0);
  });

  it('getTimeSlotsForRange: 30-min slot produces 1 slot', () => {
    const slots = getTimeSlotsForRange('2026-09-21', '14:00', '14:30');
    expect(slots).toHaveLength(1);
    expect(slots[0].slotKey).toBe('2026-09-21#28');
  });
});

// ─── Booking Validator API Tests ────────────────────────────────────────────

describe('Validation — Booking API input validation', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBookingBase = {
    listingId: 'listing_x',
    vehicleId: 'vehicle_x',
    date: '2026-09-21',
    startTime: '10:00',
    endTime: '12:00',
  };

  const invalidCases = [
    { desc: 'missing listingId', body: { ...validBookingBase, listingId: '' } },
    { desc: 'missing vehicleId', body: { ...validBookingBase, vehicleId: '' } },
    { desc: 'invalid date format', body: { ...validBookingBase, date: '21-09-2026' } },
    { desc: 'invalid startTime format', body: { ...validBookingBase, startTime: '10:60' } },
    { desc: 'invalid endTime format', body: { ...validBookingBase, endTime: '25:00' } },
    { desc: 'missing date', body: { ...validBookingBase, date: undefined } },
  ];

  test.each(invalidCases)(
    'should return 400 for $desc',
    async ({ body }) => {
      const res = await request(app)
        .post('/bookings')
        .set(asDriver())
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  );
});

// ─── Parking Listing Validator API Tests ────────────────────────────────────

describe('Validation — Parking listing API input validation', () => {
  beforeEach(() => jest.clearAllMocks());

  const invalidListingCases = [
    {
      desc: 'negative price per hour',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64, parkingType: 'OPEN',
        capacity: 1, vehicleTypes: ['CAR'], pricePerHour: -10,
      },
    },
    {
      desc: 'capacity of 0',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64, parkingType: 'OPEN',
        capacity: 0, vehicleTypes: ['CAR'], pricePerHour: 50,
      },
    },
    {
      desc: 'invalid latitude (>90)',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 95, longitude: 77.64, parkingType: 'OPEN',
        capacity: 1, vehicleTypes: ['CAR'], pricePerHour: 50,
      },
    },
    {
      desc: 'invalid longitude (<-180)',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: -200, parkingType: 'OPEN',
        capacity: 1, vehicleTypes: ['CAR'], pricePerHour: 50,
      },
    },
    {
      desc: 'invalid parkingType',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64, parkingType: 'ROOFTOP',
        capacity: 1, vehicleTypes: ['CAR'], pricePerHour: 50,
      },
    },
    {
      desc: 'empty vehicleTypes array',
      body: {
        title: 'Test Spot', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64, parkingType: 'OPEN',
        capacity: 1, vehicleTypes: [], pricePerHour: 50,
      },
    },
    {
      desc: 'title too short (< 3 chars)',
      body: {
        title: 'AB', description: 'A parking spot for tests',
        address: '1 Test Rd', area: 'TestArea', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64, parkingType: 'OPEN',
        capacity: 1, vehicleTypes: ['CAR'], pricePerHour: 50,
      },
    },
  ];

  test.each(invalidListingCases)(
    'should return 400 for $desc',
    async ({ body }) => {
      const res = await request(app)
        .post('/parking')
        .set(asHost())
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  );
});

// ─── Review Validator API Tests ─────────────────────────────────────────────

describe('Validation — Review API input validation', () => {
  beforeEach(() => jest.clearAllMocks());

  const invalidReviewCases = [
    { desc: 'rating below 1', body: { listingId: 'l1', bookingId: 'b1', rating: 0, comment: 'Bad' } },
    { desc: 'rating above 5', body: { listingId: 'l1', bookingId: 'b1', rating: 6, comment: 'Great' } },
    { desc: 'missing comment', body: { listingId: 'l1', bookingId: 'b1', rating: 4 } },
    { desc: 'empty comment', body: { listingId: 'l1', bookingId: 'b1', rating: 4, comment: '' } },
    { desc: 'missing bookingId', body: { listingId: 'l1', rating: 4, comment: 'Good' } },
    { desc: 'non-integer rating', body: { listingId: 'l1', bookingId: 'b1', rating: 3.5, comment: 'OK' } },
  ];

  test.each(invalidReviewCases)(
    'should return 400 for $desc',
    async ({ body }) => {
      const res = await request(app)
        .post('/reviews')
        .set(asDriver())
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  );

  it('should return 400 when review is for non-COMPLETED booking', async () => {
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk1',
      listingId: 'l1',
      driverId: DRIVER,
      bookingStatus: 'CONFIRMED', // Not completed
    });

    const res = await request(app)
      .post('/reviews')
      .set(asDriver())
      .send({ listingId: 'l1', bookingId: 'bk1', rating: 5, comment: 'Great spot!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 403 when Driver B tries to review Driver A booking', async () => {
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk1',
      listingId: 'l1',
      driverId: DRIVER,  // owned by DRIVER, not DRIVER B
      bookingStatus: 'COMPLETED',
    });

    const res = await request(app)
      .post('/reviews')
      .set(asDriver('driver_b_intruder'))
      .send({ listingId: 'l1', bookingId: 'bk1', rating: 5, comment: 'Great spot!' });
    expect(res.status).toBe(403);
  });

  it('should return 409 on duplicate review for same booking', async () => {
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk1',
      listingId: 'l1',
      driverId: DRIVER,
      bookingStatus: 'COMPLETED',
    });
    (reviewRepository.findByBookingId as jest.Mock).mockResolvedValue({
      reviewId: 'existing_review',
      bookingId: 'bk1',
    });

    const res = await request(app)
      .post('/reviews')
      .set(asDriver())
      .send({ listingId: 'l1', bookingId: 'bk1', rating: 4, comment: 'Nice place' });
    expect(res.status).toBe(409);
  });
});

// ─── Vehicle Validator API Tests ─────────────────────────────────────────────

describe('Validation — Vehicle API input validation', () => {
  beforeEach(() => jest.clearAllMocks());

  const invalidVehicleCases = [
    { desc: 'missing vehicleNumber', body: { vehicleType: 'CAR', make: 'Toyota', model: 'Camry', color: 'Red' } },
    { desc: 'invalid vehicleType', body: { vehicleNumber: 'KA01', vehicleType: 'HELICOPTER', make: 'X', model: 'Y', color: 'Z' } },
    { desc: 'missing make', body: { vehicleNumber: 'KA01', vehicleType: 'CAR', model: 'Camry', color: 'Red' } },
    { desc: 'missing model', body: { vehicleNumber: 'KA01', vehicleType: 'CAR', make: 'Toyota', color: 'Red' } },
    { desc: 'missing color', body: { vehicleNumber: 'KA01', vehicleType: 'CAR', make: 'Toyota', model: 'Camry' } },
  ];

  test.each(invalidVehicleCases)(
    'should return 400 for $desc',
    async ({ body }) => {
      const res = await request(app)
        .post('/vehicles')
        .set(asDriver())
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  );
});

// ─── Payment State Machine Tests (Service Layer) ─────────────────────────────

describe('Validation — Payment state machine transitions', () => {
  const paidPayment: Payment = {
    paymentId: 'pay_sm1',
    bookingId: 'bk_sm1',
    userId: DRIVER,
    amount: 110,
    currency: 'INR',
    status: 'PAID',
    provider: 'MOCK',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  };

  const pendingPayment: Payment = { ...paidPayment, status: 'PENDING' };

  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk_sm1',
      driverId: DRIVER,
      hostId: HOST,
    });
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  it('processPayment on PAID payment returns idempotent success (200)', async () => {
    (paymentRepository.findById as jest.Mock).mockResolvedValue(paidPayment);

    const res = await request(app)
      .post('/payments/pay_sm1/process')
      .set(asDriver())
      .send({});

    // Already PAID → idempotent — returns 200 with current PAID status
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PAID');
  });

  it('paymentService.refundPayment throws on invalid PENDING→REFUNDED transition', async () => {
    (paymentRepository.findById as jest.Mock).mockResolvedValue(pendingPayment);

    // The VALID_PAYMENT_TRANSITIONS: PENDING can go to PROCESSING, PAID, FAILED — NOT REFUNDED
    await expect(
      paymentService.refundPayment('pay_sm1', DRIVER, 'DRIVER')
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('paymentService.refundPayment succeeds when payment is PAID', async () => {
    const updatedPayment: Payment = { ...paidPayment, status: 'REFUNDED' };
    (paymentRepository.findById as jest.Mock).mockResolvedValue(paidPayment);
    (paymentRepository.updateStatus as jest.Mock).mockResolvedValue(updatedPayment);
    (bookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(undefined);

    const result = await paymentService.refundPayment('pay_sm1', DRIVER, 'DRIVER');
    expect(result.status).toBe('REFUNDED');
  });
});

// ─── Booking Business Logic — Operating Hours ───────────────────────────────

describe('Validation — Booking outside operating hours', () => {
  const mondayOnlyListing = {
    listingId: 'listing_hours',
    hostId: HOST,
    title: 'Weekday Only',
    description: 'Only open on Monday morning',
    address: '5 Hours Rd',
    area: 'Koramangala',
    city: 'Bengaluru',
    latitude: 12.93,
    longitude: 77.62,
    parkingType: 'OPEN',
    capacity: 2,
    vehicleTypes: ['CAR'],
    pricePerHour: 30,
    amenities: [],
    photos: [],
    availability: {
      monday: { open: '09:00', close: '17:00' },
      // No other days
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.0,
    reviewCount: 5,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(mondayOnlyListing);
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValue(true);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
    (paymentRepository.create as jest.Mock).mockResolvedValue({} as any);
    (bookingRepository.create as jest.Mock).mockImplementation(async (b) => b);
  });

  it('should return 400 when booking on a day the listing is closed (Thursday)', async () => {
    // 2026-09-24 is a Thursday
    const res = await request(app)
      .post('/bookings')
      .set(asDriver())
      .send({
        listingId: 'listing_hours',
        vehicleId: 'vehicle_x',
        date: '2026-09-24',
        startTime: '10:00',
        endTime: '12:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when booking starts before opening time', async () => {
    // 2026-09-21 is a Monday; opens at 09:00
    const res = await request(app)
      .post('/bookings')
      .set(asDriver())
      .send({
        listingId: 'listing_hours',
        vehicleId: 'vehicle_x',
        date: '2026-09-21',
        startTime: '07:00',
        endTime: '09:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when booking extends past closing time', async () => {
    // Closes at 17:00
    const res = await request(app)
      .post('/bookings')
      .set(asDriver())
      .send({
        listingId: 'listing_hours',
        vehicleId: 'vehicle_x',
        date: '2026-09-21',
        startTime: '16:00',
        endTime: '19:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 201 for a valid booking within operating hours on Monday', async () => {
    const res = await request(app)
      .post('/bookings')
      .set(asDriver())
      .send({
        listingId: 'listing_hours',
        vehicleId: 'vehicle_x',
        date: '2026-09-21',
        startTime: '10:00',
        endTime: '12:00',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.bookingStatus).toBe('CONFIRMED');
  });
});

// ─── Search Validator API Tests ─────────────────────────────────────────────

describe('Validation — Search API parameter validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.listActive as jest.Mock).mockResolvedValue([]);
    (parkingRepository.findByArea as jest.Mock).mockResolvedValue([]);
    (parkingRepository.findByCity as jest.Mock).mockResolvedValue([]);
  });

  it('should return 400 for invalid lat (>90)', async () => {
    const res = await request(app)
      .get('/parking?lat=95&lng=77.64');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid parkingType', async () => {
    const res = await request(app)
      .get('/parking?parkingType=ROOFTOP');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid vehicleType', async () => {
    const res = await request(app)
      .get('/parking?vehicleType=HELICOPTER');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 200 for valid search params', async () => {
    const res = await request(app)
      .get('/parking?area=Indiranagar&limit=10');
    expect(res.status).toBe(200);
  });
});

// ─── Cancel Booking — Cannot Cancel Already Cancelled ──────────────────────

describe('Validation — Booking cancellation guard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when trying to cancel an already-CANCELLED booking', async () => {
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk_already_cancelled',
      listingId: 'l1',
      hostId: HOST,
      driverId: DRIVER,
      bookingStatus: 'CANCELLED',
      totalAmount: 110,
    } as Booking);

    const res = await request(app)
      .post('/bookings/bk_already_cancelled/cancel')
      .set(asDriver())
      .send({ reason: 'Duplicate cancel' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when trying to cancel a COMPLETED booking', async () => {
    (bookingRepository.findById as jest.Mock).mockResolvedValue({
      bookingId: 'bk_completed',
      listingId: 'l1',
      hostId: HOST,
      driverId: DRIVER,
      bookingStatus: 'COMPLETED',
      totalAmount: 110,
    } as Booking);

    const res = await request(app)
      .post('/bookings/bk_completed/cancel')
      .set(asDriver())
      .send({ reason: 'Too late' });

    expect(res.status).toBe(400);
  });
});

// ─── 404 Handling ────────────────────────────────────────────────────────────

describe('Validation — 404 for non-existent resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue(null);
    (parkingRepository.findById as jest.Mock).mockResolvedValue(null);
    (vehicleRepository.findById as jest.Mock).mockResolvedValue(null);
  });

  it('should return 404 for non-existent booking', async () => {
    const res = await request(app)
      .get('/bookings/nonexistent_booking_xyz')
      .set(asDriver());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toContain('NOT_FOUND');
  });

  it('should return 404 for non-existent parking listing', async () => {
    const res = await request(app)
      .get('/parking/nonexistent_listing_xyz');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toContain('NOT_FOUND');
  });

  it('should return 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .get('/vehicles/nonexistent_vehicle_xyz')
      .set(asDriver());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toContain('NOT_FOUND');
  });

  it('should return 404 for unknown API route', async () => {
    const res = await request(app).get('/nonexistent/route/xyz');
    expect(res.status).toBe(404);
  });
});
