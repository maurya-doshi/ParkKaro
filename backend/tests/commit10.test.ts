import request from 'supertest';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/userRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { payoutRepository } from '../src/repositories/payoutRepository';
import { vehicleRepository } from '../src/repositories/vehicleRepository';
import { favoriteRepository } from '../src/repositories/favoriteRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { disputeRepository } from '../src/repositories/disputeRepository';
import { reportRepository } from '../src/repositories/reportRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { User } from '../src/models/User';
import { ParkingListing } from '../src/models/ParkingListing';
import { Booking } from '../src/models/Booking';
import { Payout } from '../src/models/Payout';
import { Vehicle } from '../src/models/Vehicle';
import { Favorite } from '../src/models/Favorite';
import { Notification } from '../src/models/Notification';
import { Dispute } from '../src/models/Dispute';
import { Report } from '../src/models/Report';
import { Payment } from '../src/models/Payment';

jest.mock('../src/repositories/userRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/payoutRepository');
jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/favoriteRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/disputeRepository');
jest.mock('../src/repositories/reportRepository');
jest.mock('../src/repositories/paymentRepository');

// ─── Test Fixtures ───────────────────────────────────────────
const mockUserHost: User = {
  userId: 'host_1',
  email: 'host1@example.com',
  name: 'Host One',
  role: 'HOST',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const mockUserDriver: User = {
  userId: 'driver_1',
  email: 'driver1@example.com',
  name: 'Driver One',
  role: 'DRIVER',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const mockListing: ParkingListing = {
  listingId: 'listing_1',
  hostId: 'host_1',
  title: 'Covered Spot in Koramangala',
  description: 'Clean and secure',
  address: '100 Feet Rd',
  area: 'Koramangala',
  city: 'Bengaluru',
  latitude: 12.9352,
  longitude: 77.6245,
  parkingType: 'COVERED',
  capacity: 2,
  vehicleTypes: ['CAR'],
  pricePerHour: 50,
  amenities: ['covered', 'cctv'],
  photos: [],
  availability: {},
  cancellationPolicy: 'MODERATE',
  rating: 4.8,
  reviewCount: 5,
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const mockBooking1: Booking = {
  bookingId: 'booking_1',
  listingId: 'listing_1',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_1',
  startTime: '2026-09-25T10:00:00.000Z',
  endTime: '2026-09-25T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 100,
  platformFee: 10,
  tax: 0,
  totalAmount: 110,
  hostEarnings: 90,
  paymentStatus: 'PAID',
  bookingStatus: 'CONFIRMED',
  qrData: 'qrdata',
  qrVerificationCode: '1111',
  createdAt: '2026-09-19T08:00:00.000Z',
  updatedAt: '2026-09-19T08:00:00.000Z',
};

const mockBooking2: Booking = {
  bookingId: 'booking_2',
  listingId: 'listing_1',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_1',
  startTime: '2026-09-18T10:00:00.000Z',
  endTime: '2026-09-18T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 100,
  platformFee: 10,
  tax: 0,
  totalAmount: 110,
  hostEarnings: 90,
  paymentStatus: 'PAID',
  bookingStatus: 'COMPLETED',
  qrData: 'qrdata',
  qrVerificationCode: '2222',
  createdAt: '2026-09-18T08:00:00.000Z',
  updatedAt: '2026-09-18T12:00:00.000Z',
};

const mockBookingCancelled: Booking = {
  bookingId: 'booking_3',
  listingId: 'listing_1',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_1',
  startTime: '2026-09-17T10:00:00.000Z',
  endTime: '2026-09-17T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 100,
  platformFee: 10,
  tax: 0,
  totalAmount: 110,
  hostEarnings: 90,
  paymentStatus: 'REFUNDED',
  bookingStatus: 'CANCELLED',
  qrData: 'qrdata',
  qrVerificationCode: '3333',
  createdAt: '2026-09-17T08:00:00.000Z',
  updatedAt: '2026-09-17T09:00:00.000Z',
};

const mockPayout: Payout = {
  payoutId: 'payout_1',
  hostId: 'host_1',
  amount: 90,
  currency: 'INR',
  status: 'COMPLETED',
  period: '2026-09',
  bookingIds: ['booking_2'],
  createdAt: '2026-09-18T15:00:00.000Z',
  updatedAt: '2026-09-18T15:00:00.000Z',
};

const mockVehicle: Vehicle = {
  vehicleId: 'vehicle_1',
  userId: 'driver_1',
  vehicleNumber: 'KA-01-AB-1234',
  vehicleType: 'CAR',
  make: 'Hyundai',
  model: 'Creta',
  color: 'White',
  isDefault: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const mockFavorite: Favorite = {
  userId: 'driver_1',
  listingId: 'listing_1',
  createdAt: '2026-09-01T00:00:00.000Z',
};

const mockNotification: Notification = {
  userId: 'host_1',
  notificationId: 'notif_1',
  type: 'BOOKING_CONFIRMED',
  title: 'New Booking',
  message: 'Reservation confirmed',
  read: false,
  createdAt: '2026-09-19T08:00:00.000Z',
};

const mockDispute: Dispute = {
  disputeId: 'dispute_1',
  bookingId: 'booking_1',
  reportedBy: 'driver_1',
  reason: 'Slot occupied',
  description: 'Another car in space',
  evidence: [],
  status: 'OPEN',
  createdAt: '2026-09-19T09:00:00.000Z',
  updatedAt: '2026-09-19T09:00:00.000Z',
};

const mockReport: Report = {
  reportId: 'report_1',
  reportedBy: 'driver_1',
  targetType: 'LISTING',
  targetId: 'listing_1',
  reason: 'Misleading',
  description: 'Wrong photos',
  status: 'PENDING',
  createdAt: '2026-09-19T09:00:00.000Z',
  updatedAt: '2026-09-19T09:00:00.000Z',
};

const mockPayment: Payment = {
  paymentId: 'payment_1',
  bookingId: 'booking_1',
  userId: 'driver_1',
  amount: 110,
  currency: 'INR',
  status: 'PAID',
  provider: 'MOCK',
  createdAt: '2026-09-19T08:00:00.000Z',
  updatedAt: '2026-09-19T08:00:00.000Z',
};

describe('COMMIT 10 — Dashboards & Admin APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // 1. HOST DASHBOARD
  // ═══════════════════════════════════════════════════════════
  describe('GET /host/dashboard', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/host/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return 403 when user is DRIVER', async () => {
      const res = await request(app)
        .get('/host/dashboard')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });

    it('should return real aggregated metrics for authenticated host', async () => {
      (parkingRepository.findByHostId as jest.Mock).mockResolvedValue([mockListing]);
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([
        mockBooking1,
        mockBooking2,
        mockBookingCancelled,
      ]);
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([mockPayout]);
      (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([mockNotification]);

      const res = await request(app)
        .get('/host/dashboard')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalListings).toBe(1);
      expect(data.activeListings).toBe(1);
      expect(data.totalBookings).toBe(3);
      expect(data.completedBookings).toBe(1);
      expect(data.cancelledBookings).toBe(1);
      // Total earnings: 90 (booking1) + 90 (booking2) = 180 (booking3 is cancelled)
      expect(data.totalEarnings).toBe(180);
      // Pending earnings: 180 - 90 (paid out) = 90
      expect(data.pendingEarnings).toBe(90);
      expect(data.averageRating).toBe(4.8);
      expect(data.recentBookings).toHaveLength(3);
      expect(data.recentNotifications).toHaveLength(1);

      // Verify query was strictly scoped to host_1
      expect(parkingRepository.findByHostId).toHaveBeenCalledWith('host_1');
      expect(bookingRepository.findByHostId).toHaveBeenCalledWith('host_1');
      expect(payoutRepository.findByHostId).toHaveBeenCalledWith('host_1');
    });

    it('should allow ADMIN to access host dashboard', async () => {
      (parkingRepository.findByHostId as jest.Mock).mockResolvedValue([]);
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([]);
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
      (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/host/dashboard')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. HOST LISTING SUMMARY
  // ═══════════════════════════════════════════════════════════
  describe('GET /host/listings-summary', () => {
    it('should return listing-level performance items for host', async () => {
      (parkingRepository.findByHostId as jest.Mock).mockResolvedValue([mockListing]);
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([mockBooking1, mockBooking2]);

      const res = await request(app)
        .get('/host/listings-summary')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);

      const item = res.body.data.items[0];
      expect(item.listingId).toBe('listing_1');
      expect(item.title).toBe('Covered Spot in Koramangala');
      expect(item.bookingCount).toBe(2);
      expect(item.earnings).toBe(180);
      expect(item.rating).toBe(4.8);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. HOST EARNINGS ANALYTICS
  // ═══════════════════════════════════════════════════════════
  describe('GET /host/earnings', () => {
    it('should calculate gross, platform fees, and net earnings accurately', async () => {
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([
        mockBooking1,
        mockBooking2,
        mockBookingCancelled,
      ]);

      const res = await request(app)
        .get('/host/earnings?period=30d')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.period).toBe('30d');
      // booking1 (100 base) + booking2 (100 base) = 200 gross
      expect(data.grossRevenue).toBe(200);
      // booking1 (10 fee) + booking2 (10 fee) = 20 fees
      expect(data.platformFees).toBe(20);
      // booking1 (90 net) + booking2 (90 net) = 180 net
      expect(data.netEarnings).toBe(180);
      expect(data.completedBookings).toBe(1);
      expect(data.totalBookings).toBe(2);
      expect(data.averageBookingValue).toBe(90);
      expect(data.breakdown).toBeDefined();
    });

    it('should support today, 7d, 90d, 12m, and all time ranges', async () => {
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([mockBooking1]);

      const res = await request(app)
        .get('/host/earnings?period=7d')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.data.period).toBe('7d');
    });

    it('should reject invalid period (400)', async () => {
      const res = await request(app)
        .get('/host/earnings?period=invalid_range')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. DRIVER DASHBOARD
  // ═══════════════════════════════════════════════════════════
  describe('GET /driver/dashboard', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/driver/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return 403 when user is HOST', async () => {
      const res = await request(app)
        .get('/driver/dashboard')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(403);
    });

    it('should return driver metrics with upcoming bookings, vehicles, and favorites', async () => {
      (bookingRepository.findByDriverId as jest.Mock).mockResolvedValue([
        mockBooking1,
        mockBooking2,
        mockBookingCancelled,
      ]);
      (vehicleRepository.findByUserId as jest.Mock).mockResolvedValue([mockVehicle]);
      (favoriteRepository.findByUserId as jest.Mock).mockResolvedValue([mockFavorite]);
      (notificationRepository.getUnreadCount as jest.Mock).mockResolvedValue(2);
      (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([mockNotification]);

      const res = await request(app)
        .get('/driver/dashboard')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalBookings).toBe(3);
      expect(data.upcomingBookings).toHaveLength(1);
      expect(data.upcomingBookings[0].bookingId).toBe('booking_1');
      expect(data.completedBookings).toBe(1);
      expect(data.cancelledBookings).toBe(1);
      expect(data.vehicleCount).toBe(1);
      expect(data.favoriteCount).toBe(1);
      expect(data.unreadNotifications).toBe(2);
      expect(data.recentBookings).toHaveLength(3);

      expect(bookingRepository.findByDriverId).toHaveBeenCalledWith('driver_1');
      expect(vehicleRepository.findByUserId).toHaveBeenCalledWith('driver_1');
      expect(favoriteRepository.findByUserId).toHaveBeenCalledWith('driver_1');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. ADMIN DASHBOARD & ANALYTICS
  // ═══════════════════════════════════════════════════════════
  describe('Admin Analytics & Dashboard', () => {
    it('should return 403 for non-admin on GET /admin/dashboard', async () => {
      const res = await request(app)
        .get('/admin/dashboard')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });

    it('should calculate platform-wide metrics for admin on GET /admin/dashboard', async () => {
      (userRepository.list as jest.Mock).mockResolvedValue([mockUserHost, mockUserDriver]);
      (parkingRepository.listAll as jest.Mock).mockResolvedValue([mockListing]);
      (bookingRepository.listAll as jest.Mock).mockResolvedValue([mockBooking1, mockBooking2]);
      (payoutRepository.listAll as jest.Mock).mockResolvedValue([mockPayout]);
      (disputeRepository.findByStatus as jest.Mock).mockResolvedValue([mockDispute]);
      (reportRepository.findByStatus as jest.Mock).mockResolvedValue([mockReport]);

      const res = await request(app)
        .get('/admin/dashboard')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalUsers).toBe(2);
      expect(data.totalDrivers).toBe(1);
      expect(data.totalHosts).toBe(1);
      expect(data.totalListings).toBe(1);
      expect(data.activeListings).toBe(1);
      expect(data.totalBookings).toBe(2);
      expect(data.completedBookings).toBe(1);
      // Total revenue: 110 + 110 = 220
      expect(data.totalRevenue).toBe(220);
      // Platform earnings: 10 + 10 = 20
      expect(data.platformEarnings).toBe(20);
      // Host payouts: 90
      expect(data.totalHostPayouts).toBe(90);
      expect(data.pendingDisputes).toBe(1);
      expect(data.openReports).toBe(1);
      expect(data.averageRating).toBe(4.8);
    });

    it('should support GET /admin/analytics as an alias', async () => {
      (userRepository.list as jest.Mock).mockResolvedValue([mockUserHost]);
      (parkingRepository.listAll as jest.Mock).mockResolvedValue([]);
      (bookingRepository.listAll as jest.Mock).mockResolvedValue([]);
      (payoutRepository.listAll as jest.Mock).mockResolvedValue([]);
      (disputeRepository.findByStatus as jest.Mock).mockResolvedValue([]);
      (reportRepository.findByStatus as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/admin/analytics')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 6. ADMIN RECENT ACTIVITY
  // ═══════════════════════════════════════════════════════════
  describe('GET /admin/activity', () => {
    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/admin/activity')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(403);
    });

    it('should return recent activity across bookings, users, listings, disputes, reports, payments', async () => {
      (bookingRepository.listAll as jest.Mock).mockResolvedValue([mockBooking1]);
      (userRepository.list as jest.Mock).mockResolvedValue([mockUserHost]);
      (parkingRepository.listAll as jest.Mock).mockResolvedValue([mockListing]);
      (disputeRepository.findByStatus as jest.Mock).mockResolvedValue([mockDispute]);
      (reportRepository.findByStatus as jest.Mock).mockResolvedValue([mockReport]);
      (paymentRepository.listAll as jest.Mock).mockResolvedValue([mockPayment]);

      const res = await request(app)
        .get('/admin/activity?limit=5')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.recentBookings).toHaveLength(1);
      expect(res.body.data.recentUsers).toHaveLength(1);
      expect(res.body.data.recentListings).toHaveLength(1);
      expect(res.body.data.recentDisputes).toBeDefined();
      expect(res.body.data.recentReports).toHaveLength(1);
      expect(res.body.data.recentPayments).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 7. ADMIN USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  describe('Admin User APIs', () => {
    describe('GET /admin/users', () => {
      it('should list users with role filter for admin', async () => {
        (userRepository.findByRole as jest.Mock).mockResolvedValue([mockUserDriver]);

        const res = await request(app)
          .get('/admin/users?role=DRIVER')
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
        expect(userRepository.findByRole).toHaveBeenCalledWith('DRIVER');
      });

      it('should reject non-admin with 403', async () => {
        const res = await request(app)
          .get('/admin/users')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });
    });

    describe('GET /admin/users/:id', () => {
      it('should return user details for admin', async () => {
        (userRepository.findById as jest.Mock).mockResolvedValue(mockUserDriver);

        const res = await request(app)
          .get(`/admin/users/${mockUserDriver.userId}`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.userId).toBe(mockUserDriver.userId);
      });

      it('should return 404 if user not found', async () => {
        (userRepository.findById as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
          .get('/admin/users/non_existent')
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(404);
      });
    });

    describe('PATCH /admin/users/:id/status', () => {
      it('should update user status for admin', async () => {
        (userRepository.findById as jest.Mock).mockResolvedValue(mockUserDriver);
        (userRepository.update as jest.Mock).mockResolvedValue({
          ...mockUserDriver,
          status: 'SUSPENDED',
        });

        const res = await request(app)
          .patch(`/admin/users/${mockUserDriver.userId}/status`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN')
          .send({ status: 'SUSPENDED' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('SUSPENDED');
        expect(userRepository.update).toHaveBeenCalledWith(mockUserDriver.userId, {
          status: 'SUSPENDED',
        });
      });

      it('should return 400 for invalid status', async () => {
        const res = await request(app)
          .patch(`/admin/users/${mockUserDriver.userId}/status`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN')
          .send({ status: 'BANNED_FOR_LIFE' });

        expect(res.status).toBe(400);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 8. ADMIN LISTING MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  describe('Admin Listing APIs', () => {
    describe('GET /admin/listings', () => {
      it('should list all listings for admin', async () => {
        (parkingRepository.listAll as jest.Mock).mockResolvedValue([mockListing]);

        const res = await request(app)
          .get('/admin/listings')
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
      });

      it('should filter listings by area', async () => {
        (parkingRepository.findByArea as jest.Mock).mockResolvedValue([mockListing]);

        const res = await request(app)
          .get('/admin/listings?area=Koramangala')
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(parkingRepository.findByArea).toHaveBeenCalledWith('Koramangala');
      });
    });

    describe('GET /admin/listings/:id', () => {
      it('should return listing details for admin', async () => {
        (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);

        const res = await request(app)
          .get(`/admin/listings/${mockListing.listingId}`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.listingId).toBe(mockListing.listingId);
      });
    });

    describe('PATCH /admin/listings/:id/status', () => {
      it('should update listing status to SUSPENDED for admin', async () => {
        (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);
        (parkingRepository.updateStatus as jest.Mock).mockResolvedValue({
          ...mockListing,
          status: 'SUSPENDED',
        });

        const res = await request(app)
          .patch(`/admin/listings/${mockListing.listingId}/status`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN')
          .send({ status: 'SUSPENDED' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('SUSPENDED');
        expect(parkingRepository.updateStatus).toHaveBeenCalledWith(
          mockListing.listingId,
          'SUSPENDED'
        );
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 9. ADMIN BOOKINGS MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  describe('GET /admin/bookings', () => {
    it('should list platform bookings for admin', async () => {
      (bookingRepository.listAll as jest.Mock).mockResolvedValue([mockBooking1, mockBooking2]);

      const res = await request(app)
        .get('/admin/bookings')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('should filter bookings by status', async () => {
      (bookingRepository.findByStatus as jest.Mock).mockResolvedValue([mockBooking1]);

      const res = await request(app)
        .get('/admin/bookings?status=CONFIRMED')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(bookingRepository.findByStatus).toHaveBeenCalledWith('CONFIRMED');
    });

    it('should filter bookings by driverId', async () => {
      (bookingRepository.findByDriverId as jest.Mock).mockResolvedValue([mockBooking1]);

      const res = await request(app)
        .get('/admin/bookings?driverId=driver_1')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(bookingRepository.findByDriverId).toHaveBeenCalledWith('driver_1');
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/admin/bookings')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 10. ADMIN DISPUTES & REPORTS
  // ═══════════════════════════════════════════════════════════
  describe('Admin Disputes & Reports Overview', () => {
    it('GET /admin/disputes should return all disputes for admin', async () => {
      (disputeRepository.findByStatus as jest.Mock).mockResolvedValue([mockDispute]);

      const res = await request(app)
        .get('/admin/disputes')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /admin/reports should return all reports for admin', async () => {
      (reportRepository.findByStatus as jest.Mock).mockResolvedValue([mockReport]);

      const res = await request(app)
        .get('/admin/reports')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /admin/disputes should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/admin/disputes')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(403);
    });
  });
});
