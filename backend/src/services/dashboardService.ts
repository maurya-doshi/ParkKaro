import { parkingRepository } from '../repositories/parkingRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { payoutRepository } from '../repositories/payoutRepository';
import { vehicleRepository } from '../repositories/vehicleRepository';
import { favoriteRepository } from '../repositories/favoriteRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { Booking } from '../models/Booking';
import { ParkingListing } from '../models/ParkingListing';
import { Notification } from '../models/Notification';
import { ValidationError } from '../utils/errors';

export interface HostDashboardData {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  upcomingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  recentBookings: Booking[];
  recentNotifications: Notification[];
}

export interface HostListingSummaryItem {
  listingId: string;
  title: string;
  status: string;
  capacity: number;
  pricePerHour: number;
  bookingCount: number;
  earnings: number;
  rating: number;
  reviewCount: number;
}

export interface EarningsBreakdownItem {
  date: string;
  bookings: number;
  gross: number;
  fees: number;
  net: number;
}

export interface HostEarningsData {
  period: string;
  grossRevenue: number;
  platformFees: number;
  netEarnings: number;
  totalBookings: number;
  completedBookings: number;
  averageBookingValue: number;
  breakdown: EarningsBreakdownItem[];
}

export interface DriverDashboardData {
  upcomingBookings: Booking[];
  activeBooking: Booking | null;
  completedBookings: number;
  cancelledBookings: number;
  totalBookings: number;
  favoriteCount: number;
  vehicleCount: number;
  unreadNotifications: number;
  recentBookings: Booking[];
  recentNotifications: Notification[];
}

export class DashboardService {
  /**
   * Host dashboard metrics aggregated from authoritative database records.
   */
  async getHostDashboard(hostId: string): Promise<HostDashboardData> {
    const [listings, bookings, payouts, recentNotifications] = await Promise.all([
      parkingRepository.findByHostId(hostId),
      bookingRepository.findByHostId(hostId),
      payoutRepository.findByHostId(hostId),
      notificationRepository.findByUserId(hostId, 5),
    ]);

    const now = new Date().toISOString();

    const activeListings = listings.filter((l) => l.status === 'ACTIVE');
    const upcomingBookings = bookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED' && b.startTime >= now
    );
    const activeBookings = bookings.filter((b) => b.bookingStatus === 'ACTIVE');
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED');
    const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'CANCELLED');

    // Total earnings from valid paid bookings
    const eligiblePaidBookings = bookings.filter(
      (b) => b.paymentStatus === 'PAID' && b.bookingStatus !== 'CANCELLED'
    );
    const totalEarnings = eligiblePaidBookings.reduce((sum, b) => {
      const earnings = b.hostEarnings !== undefined ? b.hostEarnings : Math.max(0, b.baseAmount - b.platformFee);
      return sum + earnings;
    }, 0);

    // Completed payouts
    const totalPaidOut = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingEarnings = Math.max(0, Math.round((totalEarnings - totalPaidOut) * 100) / 100);

    // Average host rating
    const ratedListings = listings.filter((l) => l.reviewCount > 0);
    const averageRating =
      ratedListings.length > 0
        ? Math.round((ratedListings.reduce((sum, l) => sum + l.rating, 0) / ratedListings.length) * 10) / 10
        : 0;

    // Recent bookings
    const recentBookings = [...bookings]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      totalListings: listings.length,
      activeListings: activeListings.length,
      totalBookings: bookings.length,
      upcomingBookings: upcomingBookings.length,
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingEarnings,
      averageRating,
      recentBookings,
      recentNotifications,
    };
  }

  /**
   * Listing-level performance summary for a host's properties.
   */
  async getHostListingsSummary(hostId: string): Promise<HostListingSummaryItem[]> {
    const [listings, bookings] = await Promise.all([
      parkingRepository.findByHostId(hostId),
      bookingRepository.findByHostId(hostId),
    ]);

    return listings.map((listing) => {
      const listingBookings = bookings.filter((b) => b.listingId === listing.listingId);
      const earnings = listingBookings
        .filter((b) => b.paymentStatus === 'PAID' && b.bookingStatus !== 'CANCELLED')
        .reduce((sum, b) => {
          const earned = b.hostEarnings !== undefined ? b.hostEarnings : Math.max(0, b.baseAmount - b.platformFee);
          return sum + earned;
        }, 0);

      return {
        listingId: listing.listingId,
        title: listing.title,
        status: listing.status,
        capacity: listing.capacity,
        pricePerHour: listing.pricePerHour,
        bookingCount: listingBookings.length,
        earnings: Math.round(earnings * 100) / 100,
        rating: listing.rating,
        reviewCount: listing.reviewCount,
      };
    });
  }

  /**
   * Host earnings analytics over specified time range.
   */
  async getHostEarningsAnalytics(hostId: string, period = '30d'): Promise<HostEarningsData> {
    const bookings = await bookingRepository.findByHostId(hostId);

    const now = new Date();
    let cutoffDate: Date | null = null;

    switch (period) {
      case 'today': {
        cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        break;
      }
      case '7d':
      case 'week': {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case '30d':
      case 'month': {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
      case '90d': {
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      }
      case '12m': {
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'all': {
        cutoffDate = null;
        break;
      }
      default:
        throw new ValidationError(`Invalid time period: ${period}. Supported: 7d, 30d, 90d, 12m, today, week, month, all`);
    }

    const eligibleBookings = bookings.filter((b) => {
      if (b.paymentStatus !== 'PAID') return false;
      if (b.bookingStatus === 'CANCELLED') return false;
      if (cutoffDate && new Date(b.createdAt) < cutoffDate) return false;
      return true;
    });

    const grossRevenue = eligibleBookings.reduce((sum, b) => sum + (b.baseAmount || 0), 0);
    const platformFees = eligibleBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
    const netEarnings = eligibleBookings.reduce((sum, b) => {
      const earned = b.hostEarnings !== undefined ? b.hostEarnings : Math.max(0, b.baseAmount - b.platformFee);
      return sum + earned;
    }, 0);

    const completedCount = eligibleBookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    const averageBookingValue =
      eligibleBookings.length > 0
        ? Math.round((netEarnings / eligibleBookings.length) * 100) / 100
        : 0;

    // Daily / monthly breakdown
    const breakdownMap: Record<string, EarningsBreakdownItem> = {};
    for (const b of eligibleBookings) {
      const dateKey = period === '12m' ? b.createdAt.substring(0, 7) : b.createdAt.substring(0, 10);
      if (!breakdownMap[dateKey]) {
        breakdownMap[dateKey] = {
          date: dateKey,
          bookings: 0,
          gross: 0,
          fees: 0,
          net: 0,
        };
      }
      const earnings = b.hostEarnings !== undefined ? b.hostEarnings : Math.max(0, b.baseAmount - b.platformFee);
      breakdownMap[dateKey].bookings += 1;
      breakdownMap[dateKey].gross += b.baseAmount || 0;
      breakdownMap[dateKey].fees += b.platformFee || 0;
      breakdownMap[dateKey].net += earnings;
    }

    const breakdown = Object.values(breakdownMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      platformFees: Math.round(platformFees * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      totalBookings: eligibleBookings.length,
      completedBookings: completedCount,
      averageBookingValue,
      breakdown,
    };
  }

  /**
   * Driver dashboard with upcoming bookings, active session, vehicles, and notifications.
   */
  async getDriverDashboard(driverId: string): Promise<DriverDashboardData> {
    const [bookings, vehicles, favorites, unreadCount, recentNotifications] = await Promise.all([
      bookingRepository.findByDriverId(driverId),
      vehicleRepository.findByUserId(driverId),
      favoriteRepository.findByUserId(driverId),
      notificationRepository.getUnreadCount(driverId),
      notificationRepository.findByUserId(driverId, 5),
    ]);

    const now = new Date().toISOString();

    const upcomingBookings = bookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' && b.startTime >= now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const activeBooking = bookings.find((b) => b.bookingStatus === 'ACTIVE') || null;
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;

    const recentBookings = [...bookings]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      upcomingBookings,
      activeBooking,
      completedBookings,
      cancelledBookings,
      totalBookings: bookings.length,
      favoriteCount: favorites.length,
      vehicleCount: vehicles.length,
      unreadNotifications: unreadCount,
      recentBookings,
      recentNotifications,
    };
  }
}

export const dashboardService = new DashboardService();
