import request from 'supertest';
import { app } from '../src/app';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { payoutRepository } from '../src/repositories/payoutRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { Payment } from '../src/models/Payment';
import { Booking } from '../src/models/Booking';
import { Payout } from '../src/models/Payout';

jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/payoutRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/notificationRepository');

const mockBooking: Booking = {
  bookingId: 'booking_pay_1',
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
  qrVerificationCode: 'X1Y2Z3W4',
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
};

const mockPayment: Payment = {
  paymentId: 'pay_test123456',
  bookingId: 'booking_pay_1',
  userId: 'driver_1',
  amount: 110,
  currency: 'INR',
  status: 'PENDING',
  provider: 'MOCK',
  providerRef: 'mock_txn_abc123',
  createdAt: '2026-09-20T10:05:00.000Z',
  updatedAt: '2026-09-20T10:05:00.000Z',
};

const mockPaidBooking: Booking = {
  ...mockBooking,
  bookingId: 'booking_paid_1',
  paymentStatus: 'PAID',
  bookingStatus: 'COMPLETED',
};

const mockPayout: Payout = {
  payoutId: 'payout_test1234',
  hostId: 'host_1',
  amount: 90,
  currency: 'INR',
  status: 'COMPLETED',
  period: '2026-09',
  bookingIds: ['booking_paid_1'],
  createdAt: '2026-09-20T12:00:00.000Z',
  updatedAt: '2026-09-20T12:00:00.000Z',
};

describe('Payment APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
    (paymentRepository.findByBookingId as jest.Mock).mockResolvedValue(null);
    (paymentRepository.create as jest.Mock).mockImplementation(async (p) => p);
    (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);
    (paymentRepository.updateStatus as jest.Mock).mockImplementation(
      async (id, status, ref) => ({ ...mockPayment, status, providerRef: ref || mockPayment.providerRef })
    );
    (bookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(mockBooking);
  });

  // ─── POST /payments ──────────────────────────────────────────
  describe('POST /payments', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/payments')
        .send({ bookingId: 'booking_pay_1' });

      expect(res.status).toBe(401);
    });

    it('should create payment using server-authoritative amount (ignoring client amount)', async () => {
      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'booking_pay_1', amount: 999, currency: 'USD' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(110); // Server's booking.totalAmount, NOT client's 999
      expect(res.body.data.currency).toBe('INR'); // Server's currency, NOT client's USD
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.provider).toBe('MOCK');
      expect(res.body.data.providerRef).toBeDefined();
    });

    it('should return 400 when bookingId is missing', async () => {
      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return existing payment for idempotent duplicate (PENDING status)', async () => {
      const existingPending = { ...mockPayment, status: 'PENDING' as const };
      (paymentRepository.findByBookingId as jest.Mock).mockResolvedValue(existingPending);

      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'booking_pay_1' });

      expect(res.status).toBe(201);
      expect(res.body.data.paymentId).toBe('pay_test123456');
      // Should NOT create a new payment
      expect(paymentRepository.create).not.toHaveBeenCalled();
    });

    it('should return existing payment for idempotent duplicate (PAID status)', async () => {
      const existingPaid = { ...mockPayment, status: 'PAID' as const };
      (paymentRepository.findByBookingId as jest.Mock).mockResolvedValue(existingPaid);

      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'booking_pay_1' });

      expect(res.status).toBe(201);
      expect(paymentRepository.create).not.toHaveBeenCalled();
    });

    it('should return 403 when non-owner tries to create payment', async () => {
      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'hacker_user')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'booking_pay_1' });

      expect(res.status).toBe(403);
    });

    it('should return 404 when booking does not exist', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/payments')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'nonexistent_booking' });

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /payments (alt endpoint) ───────────────────────────
  describe('POST /payments/create', () => {
    it('should also work via /payments/create alias', async () => {
      const res = await request(app)
        .post('/payments/create')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ bookingId: 'booking_pay_1' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── GET /payments/:id ───────────────────────────────────────
  describe('GET /payments/:id', () => {
    it('should return payment details for the payer', async () => {
      const res = await request(app)
        .get('/payments/pay_test123456')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.paymentId).toBe('pay_test123456');
      expect(res.body.data.amount).toBe(110);
    });

    it('should return payment details for the host', async () => {
      (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

      const res = await request(app)
        .get('/payments/pay_test123456')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.data.paymentId).toBe('pay_test123456');
    });

    it('should return 403 for unrelated user', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

      const res = await request(app)
        .get('/payments/pay_test123456')
        .set('x-demo-user-id', 'stranger_user')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent payment', async () => {
      (paymentRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/payments/pay_nonexistent')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(404);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/payments/pay_test123456');

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /payments/:id/process ──────────────────────────────
  describe('POST /payments/:id/process', () => {
    it('should process and finalize a PENDING payment', async () => {
      const res = await request(app)
        .post('/payments/pay_test123456/process')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAID');
      expect(bookingRepository.updatePaymentStatus).toHaveBeenCalledWith('booking_pay_1', 'PAID');
    });

    it('should return idempotent success if payment is already PAID', async () => {
      (paymentRepository.findById as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });

      const res = await request(app)
        .post('/payments/pay_test123456/process')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAID');
    });

    it('should fail payment when force_failure is set', async () => {
      (paymentRepository.updateStatus as jest.Mock).mockImplementation(
        async (id, status, ref) => ({ ...mockPayment, status, providerRef: ref || mockPayment.providerRef })
      );

      const res = await request(app)
        .post('/payments/pay_test123456/process')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ force_failure: 'true', failure_reason: 'Card declined' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FAILED');
      expect(bookingRepository.updatePaymentStatus).toHaveBeenCalledWith('booking_pay_1', 'FAILED');
    });

    it('should reject invalid state transition (REFUNDED → PAID)', async () => {
      (paymentRepository.findById as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
      });

      const res = await request(app)
        .post('/payments/pay_test123456/process')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid payment transition');
    });

    it('should also work via /payments/:id/confirm alias', async () => {
      const res = await request(app)
        .post('/payments/pay_test123456/confirm')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(200);
    });
  });
});

// ─── Payment State Machine Tests ─────────────────────────────
describe('Payment State Machine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
    (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);
    (paymentRepository.updateStatus as jest.Mock).mockImplementation(
      async (id, status, ref) => ({ ...mockPayment, status, providerRef: ref || mockPayment.providerRef })
    );
    (bookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(mockBooking);
  });

  it('should allow PENDING → PAID', async () => {
    const res = await request(app)
      .post('/payments/pay_test123456/process')
      .set('x-demo-user-id', 'driver_1')
      .set('x-demo-role', 'DRIVER')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PAID');
  });

  it('should allow FAILED → PENDING (retry)', async () => {
    // FAILED payment exists; creating a new one should be allowed
    (paymentRepository.findByBookingId as jest.Mock).mockResolvedValue({
      ...mockPayment,
      status: 'FAILED',
    });
    (paymentRepository.create as jest.Mock).mockImplementation(async (p) => p);

    const res = await request(app)
      .post('/payments')
      .set('x-demo-user-id', 'driver_1')
      .set('x-demo-role', 'DRIVER')
      .send({ bookingId: 'booking_pay_1' });

    expect(res.status).toBe(201);
    // A new payment should be created (the FAILED one is not returned)
    expect(paymentRepository.create).toHaveBeenCalled();
  });
});

// ─── Pricing Service Tests ───────────────────────────────────
describe('Pricing Service', () => {
  // Import directly for unit testing
  const { PricingService } = require('../src/services/pricingService');
  const pricingService = new PricingService();

  it('should calculate price breakdown correctly', () => {
    const result = pricingService.calculate(50, '2026-09-21T10:00:00.000Z', '2026-09-21T12:00:00.000Z');
    expect(result.baseAmount).toBe(100);
    expect(result.durationHours).toBe(2);
    expect(result.ratePerHour).toBe(50);
    expect(result.totalAmount).toBeGreaterThan(result.baseAmount);
  });

  it('should throw error when end time is before start time', () => {
    expect(() => {
      pricingService.calculate(50, '2026-09-21T14:00:00.000Z', '2026-09-21T12:00:00.000Z');
    }).toThrow('End time must be after start time');
  });

  it('should calculate host earnings with default commission', () => {
    const earnings = pricingService.calculateHostEarnings(100);
    expect(earnings).toBe(90); // 100 - 10% commission
  });

  it('should calculate host earnings with custom commission', () => {
    const earnings = pricingService.calculateHostEarnings(100, 15);
    expect(earnings).toBe(85); // 100 - 15% commission
  });

  it('should never return negative host earnings', () => {
    const earnings = pricingService.calculateHostEarnings(0, 10);
    expect(earnings).toBeGreaterThanOrEqual(0);
  });
});

// ─── Payout APIs ─────────────────────────────────────────────
describe('Payout APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([mockPaidBooking]);
    (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
    (payoutRepository.create as jest.Mock).mockImplementation(async (p) => p);
  });

  describe('POST /host/payouts', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/host/payouts')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should create payout for eligible host bookings', async () => {
      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hostId).toBe('host_1');
      expect(res.body.data.amount).toBe(90); // Host earnings from mockPaidBooking
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.bookingIds).toContain('booking_paid_1');
    });

    it('should return 403 when DRIVER tries to request payout', async () => {
      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({});

      expect(res.status).toBe(403);
    });

    it('should return 400 when no eligible bookings exist', async () => {
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should not include already-paid-out bookings', async () => {
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([
        { ...mockPayout, bookingIds: ['booking_paid_1'], status: 'COMPLETED' },
      ]);

      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({});

      // No eligible bookings left
      expect(res.status).toBe(400);
    });

    it('should not include cancelled bookings', async () => {
      const cancelledBooking: Booking = {
        ...mockPaidBooking,
        bookingId: 'booking_cancelled',
        bookingStatus: 'CANCELLED',
        paymentStatus: 'PAID',
      };
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([cancelledBooking]);

      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should not include unpaid bookings', async () => {
      const unpaidBooking: Booking = {
        ...mockPaidBooking,
        bookingId: 'booking_unpaid',
        paymentStatus: 'PENDING',
      };
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([unpaidBooking]);

      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should filter by specific bookingIds when provided', async () => {
      const booking2: Booking = {
        ...mockPaidBooking,
        bookingId: 'booking_paid_2',
        hostEarnings: 180,
      };
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([mockPaidBooking, booking2]);

      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ bookingIds: ['booking_paid_2'] });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(180);
      expect(res.body.data.bookingIds).toEqual(['booking_paid_2']);
    });

    it('should accept optional period parameter', async () => {
      const res = await request(app)
        .post('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ period: '2026-09' });

      expect(res.status).toBe(201);
      expect(res.body.data.period).toBe('2026-09');
    });
  });

  describe('GET /host/payouts', () => {
    it('should list payouts for authenticated host', async () => {
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([mockPayout]);

      const res = await request(app)
        .get('/host/payouts')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].payoutId).toBe('payout_test1234');
    });

    it('should return empty list for host with no payouts', async () => {
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/host/payouts')
        .set('x-demo-user-id', 'host_new')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/host/payouts');
      expect(res.status).toBe(401);
    });
  });
});

// ─── Mock Provider Tests ─────────────────────────────────────
describe('MockPaymentProvider', () => {
  const { MockPaymentProvider } = require('../src/services/payment/mockProvider');
  const provider = new MockPaymentProvider();

  it('should create a payment intent with PENDING status', async () => {
    const result = await provider.createPaymentIntent({
      bookingId: 'booking_1',
      userId: 'user_1',
      amount: 100,
      currency: 'INR',
    });

    expect(result.status).toBe('PENDING');
    expect(result.providerRef).toMatch(/^mock_txn_/);
  });

  it('should successfully process a payment', async () => {
    const result = await provider.processPayment('pay_1', 'mock_ref', 100);

    expect(result.success).toBe(true);
    expect(result.status).toBe('PAID');
  });

  it('should simulate payment failure when force_failure is set', async () => {
    const result = await provider.processPayment('pay_1', 'mock_ref', 100, {
      force_failure: 'true',
      failure_reason: 'Insufficient funds',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('Insufficient funds');
  });

  it('should simulate payment failure for zero amount', async () => {
    const result = await provider.processPayment('pay_1', 'mock_ref', 0);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
  });

  it('should refund successfully', async () => {
    const result = await provider.refundPayment('mock_ref', 100);

    expect(result.success).toBe(true);
    expect(result.status).toBe('REFUNDED');
    expect(result.providerRef).toMatch(/^mock_ref_/);
  });
});

// ─── Provider Factory Tests ──────────────────────────────────
describe('Payment Provider Factory', () => {
  it('should return MockPaymentProvider by default', () => {
    const { getPaymentProvider } = require('../src/services/payment/factory');
    const provider = getPaymentProvider();
    expect(provider).toBeDefined();
    expect(provider.createPaymentIntent).toBeDefined();
    expect(provider.processPayment).toBeDefined();
    expect(provider.refundPayment).toBeDefined();
  });
});
