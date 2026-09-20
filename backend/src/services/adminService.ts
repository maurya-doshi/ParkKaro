import { userRepository } from '../repositories/userRepository';
import { parkingRepository } from '../repositories/parkingRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { payoutRepository } from '../repositories/payoutRepository';
import { disputeRepository } from '../repositories/disputeRepository';
import { reportRepository } from '../repositories/reportRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { User, UserRole, UserStatus } from '../models/User';
import { ParkingListing, ListingStatus } from '../models/ParkingListing';
import { Booking, BookingStatus } from '../models/Booking';
import { Dispute, DisputeStatus } from '../models/Dispute';
import { Report, ReportStatus } from '../models/Report';
import { Payment } from '../models/Payment';
import { NotFoundError } from '../utils/errors';

export interface AdminAnalyticsData {
  totalUsers: number;
  totalDrivers: number;
  totalHosts: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  platformEarnings: number;
  totalHostPayouts: number;
  pendingDisputes: number;
  openReports: number;
  averageRating: number;
  bookingsToday: number;
  revenueToday: number;
}

export interface AdminActivityData {
  recentBookings: Booking[];
  recentUsers: User[];
  recentListings: ParkingListing[];
  recentDisputes: Dispute[];
  recentReports: Report[];
  recentPayments: Payment[];
}

export class AdminService {
  /**
   * Platform-wide aggregated analytics and operational metrics.
   */
  async getAnalytics(): Promise<AdminAnalyticsData> {
    const [users, listings, bookings, payouts, disputes, reports] = await Promise.all([
      userRepository.list(200),
      parkingRepository.listAll(200),
      bookingRepository.listAll(200),
      payoutRepository.listAll(200),
      disputeRepository.findByStatus('OPEN'),
      reportRepository.findByStatus('PENDING'),
    ]);

    const totalUsers = users.length;
    const totalDrivers = users.filter((u) => u.role === 'DRIVER').length;
    const totalHosts = users.filter((u) => u.role === 'HOST').length;

    const totalListings = listings.length;
    const activeListings = listings.filter((l) => l.status === 'ACTIVE' || l.status === 'AVAILABLE').length;

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;
    const activeBookings = bookings.filter((b) => b.bookingStatus === 'ACTIVE').length;

    const now = new Date().toISOString();
    const upcomingBookings = bookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED' && b.startTime >= now
    ).length;

    const paidBookings = bookings.filter((b) => b.paymentStatus === 'PAID');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformEarnings = paidBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);

    const totalHostPayouts = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const ratedListings = listings.filter((l) => l.reviewCount > 0);
    const averageRating =
      ratedListings.length > 0
        ? Math.round((ratedListings.reduce((sum, l) => sum + l.rating, 0) / ratedListings.length) * 10) / 10
        : 0;

    const todayStr = now.substring(0, 10);
    const bookingsToday = bookings.filter((b) => b.createdAt.startsWith(todayStr)).length;
    const revenueToday = paidBookings
      .filter((b) => b.createdAt.startsWith(todayStr))
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      totalUsers,
      totalDrivers,
      totalHosts,
      totalListings,
      activeListings,
      totalBookings,
      completedBookings,
      cancelledBookings,
      activeBookings,
      upcomingBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformEarnings: Math.round(platformEarnings * 100) / 100,
      totalHostPayouts: Math.round(totalHostPayouts * 100) / 100,
      pendingDisputes: disputes.length,
      openReports: reports.length,
      averageRating,
      bookingsToday,
      revenueToday: Math.round(revenueToday * 100) / 100,
    };
  }

  /**
   * Recent activity across all platform entities.
   */
  async getActivity(limit = 10): Promise<AdminActivityData> {
    const [bookings, users, listings, openDisputes, underReviewDisputes, reports, payments] =
      await Promise.all([
        bookingRepository.listAll(100),
        userRepository.list(100),
        parkingRepository.listAll(100),
        disputeRepository.findByStatus('OPEN'),
        disputeRepository.findByStatus('UNDER_REVIEW'),
        reportRepository.findByStatus('PENDING'),
        paymentRepository.listAll(100),
      ]);

    const recentBookings = [...bookings]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const recentUsers = [...users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const recentListings = [...listings]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const allDisputes = [...openDisputes, ...underReviewDisputes]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const recentReports = [...reports]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const recentPayments = [...payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    return {
      recentBookings,
      recentUsers,
      recentListings,
      recentDisputes: allDisputes,
      recentReports,
      recentPayments,
    };
  }

  // ─── USER MANAGEMENT ──────────────────────────────────────────
  async listUsers(role?: UserRole, status?: UserStatus, limit = 50): Promise<User[]> {
    let users: User[] = [];
    if (role) {
      users = await userRepository.findByRole(role);
    } else {
      users = await userRepository.list(limit * 2);
    }

    if (status) {
      users = users.filter((u) => u.status === status);
    }

    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return users.slice(0, limit);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    const updated = await userRepository.update(userId, { status });
    if (!updated) {
      throw new NotFoundError('User', userId);
    }
    return updated;
  }

  // ─── LISTING MANAGEMENT ───────────────────────────────────────
  async listListings(status?: ListingStatus, area?: string, limit = 50): Promise<ParkingListing[]> {
    let listings: ParkingListing[] = [];
    if (area) {
      listings = await parkingRepository.findByArea(area);
    } else if (status === 'ACTIVE' || status === 'AVAILABLE') {
      listings = await parkingRepository.listActive(limit);
    } else {
      listings = await parkingRepository.listAll(limit * 2);
    }

    if (status && !area && status !== 'ACTIVE' && status !== 'AVAILABLE') {
      listings = listings.filter((l) => l.status === status);
    } else if (status && area) {
      listings = listings.filter((l) => l.status === status);
    }

    listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return listings.slice(0, limit);
  }

  async getListingById(listingId: string): Promise<ParkingListing> {
    const listing = await parkingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing', listingId);
    }
    return listing;
  }

  async updateListingStatus(listingId: string, status: ListingStatus): Promise<ParkingListing> {
    const existing = await parkingRepository.findById(listingId);
    if (!existing) {
      throw new NotFoundError('Listing', listingId);
    }

    const updated = await parkingRepository.updateStatus(listingId, status);
    if (!updated) {
      throw new NotFoundError('Listing', listingId);
    }
    return updated;
  }

  // ─── BOOKINGS MANAGEMENT ──────────────────────────────────────
  async listBookings(filters: {
    status?: BookingStatus;
    driverId?: string;
    hostId?: string;
    listingId?: string;
    limit?: number;
  }): Promise<Booking[]> {
    const limit = filters.limit || 50;
    let bookings: Booking[] = [];

    if (filters.driverId) {
      bookings = await bookingRepository.findByDriverId(filters.driverId);
    } else if (filters.hostId) {
      bookings = await bookingRepository.findByHostId(filters.hostId);
    } else if (filters.listingId) {
      bookings = await bookingRepository.findByListingId(filters.listingId);
    } else if (filters.status) {
      bookings = await bookingRepository.findByStatus(filters.status);
    } else {
      bookings = await bookingRepository.listAll(limit * 2);
    }

    if (filters.status && (filters.driverId || filters.hostId || filters.listingId)) {
      bookings = bookings.filter((b) => b.bookingStatus === filters.status);
    }

    bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return bookings.slice(0, limit);
  }

  // ─── DISPUTES & REPORTS ───────────────────────────────────────
  async listDisputes(status?: DisputeStatus, limit = 50): Promise<Dispute[]> {
    let disputes: Dispute[] = [];
    if (status) {
      disputes = await disputeRepository.findByStatus(status);
    } else {
      const [open, underReview, resolved, dismissed] = await Promise.all([
        disputeRepository.findByStatus('OPEN'),
        disputeRepository.findByStatus('UNDER_REVIEW'),
        disputeRepository.findByStatus('RESOLVED'),
        disputeRepository.findByStatus('DISMISSED'),
      ]);
      disputes = [...open, ...underReview, ...resolved, ...dismissed];
    }
    disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return disputes.slice(0, limit);
  }

  async listReports(status?: ReportStatus, limit = 50): Promise<Report[]> {
    let reports: Report[] = [];
    if (status) {
      reports = await reportRepository.findByStatus(status);
    } else {
      const [pending, reviewed, actioned, dismissed] = await Promise.all([
        reportRepository.findByStatus('PENDING'),
        reportRepository.findByStatus('REVIEWED'),
        reportRepository.findByStatus('ACTIONED'),
        reportRepository.findByStatus('DISMISSED'),
      ]);
      reports = [...pending, ...reviewed, ...actioned, ...dismissed];
    }
    reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return reports.slice(0, limit);
  }
}

export const adminService = new AdminService();
