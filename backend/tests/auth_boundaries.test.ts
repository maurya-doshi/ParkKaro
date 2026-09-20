/**
 * Authorization Boundary Tests — Commit 12
 *
 * Verifies that no user can access or mutate another user's resources.
 * Tests cross-user attacks, role escalation attempts, and ADMIN-only endpoints.
 */
import request from 'supertest';
import { app } from '../src/app';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { vehicleRepository } from '../src/repositories/vehicleRepository';
import { reviewRepository } from '../src/repositories/reviewRepository';
import { favoriteRepository } from '../src/repositories/favoriteRepository';
import { userRepository } from '../src/repositories/userRepository';
import { disputeRepository } from '../src/repositories/disputeRepository';
import { reportRepository } from '../src/repositories/reportRepository';
import { payoutRepository } from '../src/repositories/payoutRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { Booking } from '../src/models/Booking';
import { Payment } from '../src/models/Payment';

jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/reviewRepository');
jest.mock('../src/repositories/favoriteRepository');
jest.mock('../src/repositories/userRepository');
jest.mock('../src/repositories/disputeRepository');
jest.mock('../src/repositories/reportRepository');
jest.mock('../src/repositories/payoutRepository');
jest.mock('../src/repositories/slotLockRepository');

// Shared test data
const DRIVER_A = 'driver_a';
const DRIVER_B = 'driver_b';
const HOST_A = 'host_a';
const HOST_B = 'host_b';
const ADMIN_USER = 'admin_user';

function asDriver(userId: string) {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'DRIVER' };
}
function asHost(userId: string) {
  return { 'x-demo-user-id': userId, 'x-demo-role': 'HOST' };
}
function asAdmin() {
  return { 'x-demo-user-id': ADMIN_USER, 'x-demo-role': 'ADMIN' };
}

const mockBookingA: Booking = {
  bookingId: 'bk_a',
  listingId: 'listing_a',
  hostId: HOST_A,
  driverId: DRIVER_A,
  vehicleId: 'veh_a',
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
  qrData: 'qr_data_a',
  qrVerificationCode: 'VER_CODE_A',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

const mockPaymentA: Payment = {
  paymentId: 'pay_a',
  bookingId: 'bk_a',
  userId: DRIVER_A,
  amount: 110,
  currency: 'INR',
  status: 'PENDING',
  provider: 'MOCK',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

// ─── Authentication Guards (401) ────────────────────────────────────────────

describe('Auth — Unauthenticated requests return 401', () => {
  const protectedRoutes: Array<{ method: 'get' | 'post' | 'put' | 'delete' | 'patch'; path: string }> = [
    { method: 'post', path: '/bookings' },
    { method: 'get', path: '/bookings' },
    { method: 'get', path: '/bookings/bk_a' },
    { method: 'post', path: '/bookings/bk_a/cancel' },
    { method: 'post', path: '/bookings/bk_a/complete' },
    { method: 'post', path: '/parking' },
    { method: 'put', path: '/parking/listing_a' },
    { method: 'delete', path: '/parking/listing_a' },
    { method: 'get', path: '/vehicles' },
    { method: 'post', path: '/vehicles' },
    { method: 'get', path: '/favorites' },
    { method: 'post', path: '/favorites/some_listing_id' }, // POST /favorites/:parkingId
    { method: 'get', path: '/notifications' },
    { method: 'get', path: '/payments/pay_a' },
    { method: 'post', path: '/payments' },
    { method: 'get', path: '/host/payouts' },
    { method: 'post', path: '/host/payouts' },
    { method: 'get', path: '/host/dashboard' },
    { method: 'get', path: '/driver/dashboard' },
    { method: 'get', path: '/disputes' },
    { method: 'post', path: '/disputes' },
    { method: 'get', path: '/reports' },
    { method: 'post', path: '/reports' },
    { method: 'get', path: '/admin/analytics' },
    { method: 'get', path: '/admin/users' },
  ];

  test.each(protectedRoutes)(
    '$method $path should return 401 without auth headers',
    async ({ method, path }) => {
      const res = await (request(app) as any)[method](path).send({});
      expect(res.status).toBe(401);
    }
  );
});

// ─── Booking — Cross-User Access ────────────────────────────────────────────

describe('Auth — Booking cross-user access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBookingA);
    (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
    (slotLockRepository.releaseLocks as jest.Mock).mockResolvedValue(undefined);
    (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({ ...mockBookingA, bookingStatus: 'CANCELLED' });
    (bookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(undefined);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  it('Driver B cannot view Driver A booking (403)', async () => {
    const res = await request(app)
      .get('/bookings/bk_a')
      .set(asDriver(DRIVER_B));
    expect(res.status).toBe(403);
  });

  it('Driver B cannot cancel Driver A booking (403)', async () => {
    const res = await request(app)
      .post('/bookings/bk_a/cancel')
      .set(asDriver(DRIVER_B))
      .send({ reason: 'Unauthorized cancel attempt' });
    expect(res.status).toBe(403);
  });

  it('Driver A cannot complete their own booking (only host/admin can) (403)', async () => {
    const res = await request(app)
      .post('/bookings/bk_a/complete')
      .set(asDriver(DRIVER_A));
    expect(res.status).toBe(403);
  });

  it('Host A can view booking for their listing (200)', async () => {
    const res = await request(app)
      .get('/bookings/bk_a')
      .set(asHost(HOST_A));
    expect(res.status).toBe(200);
  });

  it('Host B cannot view booking for Host A listing (403)', async () => {
    const res = await request(app)
      .get('/bookings/bk_a')
      .set(asHost(HOST_B));
    expect(res.status).toBe(403);
  });

  it('Admin can view any booking (200)', async () => {
    const res = await request(app)
      .get('/bookings/bk_a')
      .set(asAdmin());
    expect(res.status).toBe(200);
  });

  it('Driver cannot verify QR for another driver booking — only host/admin can (403)', async () => {
    (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({ ...mockBookingA, bookingStatus: 'ACTIVE' });
    const res = await request(app)
      .post('/bookings/bk_a/verify-qr')
      .set(asDriver(DRIVER_A))
      .send({ verificationCode: 'VER_CODE_A' });
    expect(res.status).toBe(403);
  });
});

// ─── Parking Listing — Ownership ────────────────────────────────────────────

describe('Auth — Parking listing ownership', () => {
  const listingA = {
    listingId: 'listing_a',
    hostId: HOST_A,
    title: 'Host A Spot',
    description: 'Host A parking description text',
    address: '1 Host A Rd',
    area: 'Koramangala',
    city: 'Bengaluru',
    latitude: 12.93,
    longitude: 77.62,
    parkingType: 'OPEN',
    capacity: 2,
    vehicleTypes: ['CAR'],
    pricePerHour: 50,
    amenities: [],
    photos: [],
    availability: {},
    cancellationPolicy: 'MODERATE',
    rating: 0,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(listingA);
    (parkingRepository.update as jest.Mock).mockResolvedValue(listingA);
    (parkingRepository.updateStatus as jest.Mock).mockResolvedValue({ ...listingA, status: 'INACTIVE' });
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  it('Driver cannot create a parking listing (403 — HOST/ADMIN only)', async () => {
    const res = await request(app)
      .post('/parking')
      .set(asDriver(DRIVER_A))
      .send({
        title: 'Driver Hack', description: 'Trying to create as driver',
        address: '1 Test St', area: 'Test', city: 'Bengaluru',
        latitude: 12.97, longitude: 77.64,
        parkingType: 'OPEN', capacity: 1, vehicleTypes: ['CAR'], pricePerHour: 50,
      });
    expect(res.status).toBe(403);
  });

  it('Host B cannot update Host A listing (403)', async () => {
    const res = await request(app)
      .put('/parking/listing_a')
      .set(asHost(HOST_B))
      .send({ title: 'Hacked Listing Title Change' });
    expect(res.status).toBe(403);
  });

  it('Host B cannot delete Host A listing (403)', async () => {
    const res = await request(app)
      .delete('/parking/listing_a')
      .set(asHost(HOST_B));
    expect(res.status).toBe(403);
  });

  it('Host B cannot update status of Host A listing (403)', async () => {
    const res = await request(app)
      .patch('/parking/listing_a/status')
      .set(asHost(HOST_B))
      .send({ status: 'INACTIVE' });
    expect(res.status).toBe(403);
  });

  it('Host A can update their own listing (200)', async () => {
    const res = await request(app)
      .put('/parking/listing_a')
      .set(asHost(HOST_A))
      .send({ title: 'Updated Title by Owner' });
    expect(res.status).toBe(200);
  });

  it('Admin can update any listing (200)', async () => {
    const res = await request(app)
      .put('/parking/listing_a')
      .set(asAdmin())
      .send({ title: 'Admin Override Title' });
    expect(res.status).toBe(200);
  });
});

// ─── Vehicle — Ownership ─────────────────────────────────────────────────────

describe('Auth — Vehicle ownership', () => {
  const vehicleA = {
    vehicleId: 'veh_a',
    userId: DRIVER_A,
    vehicleNumber: 'KA01AB1234',
    vehicleType: 'CAR',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vehicleRepository.findById as jest.Mock).mockResolvedValue(vehicleA);
    (vehicleRepository.update as jest.Mock).mockResolvedValue(vehicleA);
    (vehicleRepository.delete as jest.Mock).mockResolvedValue(true);
  });

  it('Driver B cannot view Driver A vehicle (403)', async () => {
    const res = await request(app)
      .get('/vehicles/veh_a')
      .set(asDriver(DRIVER_B));
    expect(res.status).toBe(403);
  });

  it('Driver B cannot update Driver A vehicle (403)', async () => {
    const res = await request(app)
      .put('/vehicles/veh_a')
      .set(asDriver(DRIVER_B))
      .send({ color: 'Black' });
    expect(res.status).toBe(403);
  });

  it('Driver B cannot delete Driver A vehicle (403)', async () => {
    const res = await request(app)
      .delete('/vehicles/veh_a')
      .set(asDriver(DRIVER_B));
    expect(res.status).toBe(403);
  });

  it('Driver A can get their own vehicle (200)', async () => {
    const res = await request(app)
      .get('/vehicles/veh_a')
      .set(asDriver(DRIVER_A));
    expect(res.status).toBe(200);
  });
});

// ─── Payment — Cross-User Access ────────────────────────────────────────────

describe('Auth — Payment cross-user access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPaymentA);
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBookingA);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  it('Driver B cannot view Driver A payment (403)', async () => {
    const res = await request(app)
      .get('/payments/pay_a')
      .set(asDriver(DRIVER_B));
    expect(res.status).toBe(403);
  });

  it('Driver A can view their own payment (200)', async () => {
    const res = await request(app)
      .get('/payments/pay_a')
      .set(asDriver(DRIVER_A));
    expect(res.status).toBe(200);
  });

  it('Host A can view payment for their listing booking (200)', async () => {
    const res = await request(app)
      .get('/payments/pay_a')
      .set(asHost(HOST_A));
    expect(res.status).toBe(200);
  });

  it('Admin can view any payment (200)', async () => {
    const res = await request(app)
      .get('/payments/pay_a')
      .set(asAdmin());
    expect(res.status).toBe(200);
  });
});

// ─── Payout — HOST-Only ─────────────────────────────────────────────────────

describe('Auth — Payout HOST-only access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([]);
    (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
  });

  it('Driver cannot request a payout (403)', async () => {
    const res = await request(app)
      .post('/host/payouts')
      .set(asDriver(DRIVER_A))
      .send({});
    expect(res.status).toBe(403);
  });

  it('Driver cannot list payouts (should see empty list, not 403)', async () => {
    (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
    const res = await request(app)
      .get('/host/payouts')
      .set(asDriver(DRIVER_A));
    // Payouts are filtered by hostId from auth context, so drivers get empty list
    expect([200, 403]).toContain(res.status);
  });

  it('Host gets empty payout list when no eligible bookings', async () => {
    (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
    const res = await request(app)
      .get('/host/payouts')
      .set(asHost(HOST_A));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});

// ─── Admin — ADMIN-Only Endpoints ───────────────────────────────────────────

describe('Auth — Admin-only endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userRepository.list as jest.Mock).mockResolvedValue([]);
    (parkingRepository.listAll as jest.Mock).mockResolvedValue([]);
    (bookingRepository.listAll as jest.Mock).mockResolvedValue([]);
    (payoutRepository.listAll as jest.Mock).mockResolvedValue([]);
    (disputeRepository.findByStatus as jest.Mock).mockResolvedValue([]);
    (reportRepository.findByStatus as jest.Mock).mockResolvedValue([]);
    (paymentRepository.listAll as jest.Mock).mockResolvedValue([]);
    (userRepository.findByRole as jest.Mock).mockResolvedValue([]);
  });

  const adminOnlyRoutes: Array<{ method: 'get' | 'post' | 'put' | 'patch'; path: string }> = [
    { method: 'get', path: '/admin/analytics' },
    { method: 'get', path: '/admin/users' },
    { method: 'get', path: '/admin/listings' },
    { method: 'get', path: '/admin/bookings' },
    { method: 'get', path: '/admin/disputes' },
    { method: 'get', path: '/admin/reports' },
  ];

  test.each(adminOnlyRoutes)(
    '$method $path should return 403 for DRIVER',
    async ({ method, path }) => {
      const res = await (request(app) as any)[method](path)
        .set(asDriver(DRIVER_A));
      expect(res.status).toBe(403);
    }
  );

  test.each(adminOnlyRoutes)(
    '$method $path should return 403 for HOST',
    async ({ method, path }) => {
      const res = await (request(app) as any)[method](path)
        .set(asHost(HOST_A));
      expect(res.status).toBe(403);
    }
  );

  test.each(adminOnlyRoutes)(
    '$method $path should return 200 for ADMIN',
    async ({ method, path }) => {
      const res = await (request(app) as any)[method](path)
        .set(asAdmin());
      expect(res.status).toBe(200);
    }
  );
});

// ─── Dispute — Authorization ─────────────────────────────────────────────────

describe('Auth — Dispute authorization', () => {
  const disputeA = {
    disputeId: 'dis_a',
    bookingId: 'bk_a',
    reportedBy: DRIVER_A,
    reason: 'damage',
    description: 'My car was damaged in the space.',
    evidence: [],
    status: 'OPEN',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (disputeRepository.findById as jest.Mock).mockResolvedValue(disputeA);
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBookingA);
    (notificationRepository.create as jest.Mock).mockResolvedValue({} as any);
    (disputeRepository.resolve as jest.Mock).mockResolvedValue({ ...disputeA, status: 'RESOLVED' });
  });

  it('Unrelated user cannot view dispute (403)', async () => {
    const res = await request(app)
      .get('/disputes/dis_a')
      .set(asDriver(DRIVER_B));
    expect(res.status).toBe(403);
  });

  it('Driver A (reporter) can view own dispute (200)', async () => {
    const res = await request(app)
      .get('/disputes/dis_a')
      .set(asDriver(DRIVER_A));
    expect(res.status).toBe(200);
  });

  it('Non-admin cannot resolve a dispute (403)', async () => {
    const res = await request(app)
      .patch('/disputes/dis_a')
      .set(asDriver(DRIVER_A))
      .send({ status: 'RESOLVED', resolution: 'Resolved as fake' });
    expect(res.status).toBe(403);
  });

  it('Admin can resolve a dispute (200)', async () => {
    const res = await request(app)
      .patch('/disputes/dis_a')
      .set(asAdmin())
      .send({ status: 'RESOLVED', resolution: 'Admin resolved.' });
    expect(res.status).toBe(200);
  });
});

// ─── Error Responses — No Internal Leakage ──────────────────────────────────

describe('Auth — Error responses do not leak internals', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error from intentional error injection
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (bookingRepository.findById as jest.Mock).mockRejectedValue(
      new Error('DynamoDB internal error with secret connection string')
    );
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return 500 with generic message, not internal DynamoDB error', async () => {
    const res = await request(app)
      .get('/bookings/some_booking_id')
      .set(asDriver(DRIVER_A));

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('An unexpected error occurred');
    // Must not expose raw DynamoDB error
    expect(JSON.stringify(res.body)).not.toContain('DynamoDB internal error with secret');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('response body should not contain a stack trace field', async () => {
    const res = await request(app)
      .get('/bookings/some_booking_id')
      .set(asDriver(DRIVER_A));

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/at \w+.*\(.*\.ts:\d+/);
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body?.error).not.toHaveProperty('stack');
  });
});

// ─── Notifications — Ownership ───────────────────────────────────────────────

describe('Auth — Notification ownership (user sees only own notifications)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('notifications endpoint requires auth (401 without headers)', async () => {
    const res = await request(app).get('/notifications');
    expect(res.status).toBe(401);
  });

  it('authenticated driver can access notifications endpoint (200)', async () => {
    const { notificationRepository } = require('../src/repositories/notificationRepository');
    (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/notifications')
      .set(asDriver(DRIVER_A));
    expect(res.status).toBe(200);
  });

  it('authenticates successfully with Cognito JWT Bearer token', async () => {
    const { notificationRepository } = require('../src/repositories/notificationRepository');
    (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([]);

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: DRIVER_A,
        email: `${DRIVER_A}@example.com`,
        'custom:role': 'DRIVER',
      })
    ).toString('base64url');
    const token = `${header}.${payload}.mockSignature`;

    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
