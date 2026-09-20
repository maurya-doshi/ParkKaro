import { seedDatabase } from '../scripts/seed';
import {
  demoUsers,
  demoListings,
  demoVehicles,
  demoFavorites,
  demoBookings,
  demoPayments,
  demoPayouts,
  demoReviews,
  demoNotifications,
  demoConversations,
  demoMessages,
  demoDisputes,
  demoReports,
} from '../scripts/seedData';

import { userRepository } from '../src/repositories/userRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { vehicleRepository } from '../src/repositories/vehicleRepository';
import { favoriteRepository } from '../src/repositories/favoriteRepository';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { payoutRepository } from '../src/repositories/payoutRepository';
import { reviewRepository } from '../src/repositories/reviewRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { conversationRepository } from '../src/repositories/conversationRepository';
import { messageRepository } from '../src/repositories/messageRepository';
import { disputeRepository } from '../src/repositories/disputeRepository';
import { reportRepository } from '../src/repositories/reportRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';

jest.mock('../src/repositories/userRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/favoriteRepository');
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/payoutRepository');
jest.mock('../src/repositories/reviewRepository');
jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/conversationRepository');
jest.mock('../src/repositories/messageRepository');
jest.mock('../src/repositories/disputeRepository');
jest.mock('../src/repositories/reportRepository');
jest.mock('../src/repositories/slotLockRepository');

describe('COMMIT 11 — Seed Data & System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userRepository.create as jest.Mock).mockImplementation(async (u) => u);
    (parkingRepository.create as jest.Mock).mockImplementation(async (p) => p);
    (vehicleRepository.create as jest.Mock).mockImplementation(async (v) => v);
    (favoriteRepository.add as jest.Mock).mockImplementation(async (u, l) => ({ userId: u, listingId: l }));
    (bookingRepository.create as jest.Mock).mockImplementation(async (b) => b);
    (paymentRepository.create as jest.Mock).mockImplementation(async (p) => p);
    (payoutRepository.create as jest.Mock).mockImplementation(async (p) => p);
    (reviewRepository.create as jest.Mock).mockImplementation(async (r) => r);
    (notificationRepository.create as jest.Mock).mockImplementation(async (n) => n);
    (conversationRepository.create as jest.Mock).mockImplementation(async (c) => c);
    (messageRepository.create as jest.Mock).mockImplementation(async (m) => m);
    (disputeRepository.create as jest.Mock).mockImplementation(async (d) => d);
    (reportRepository.create as jest.Mock).mockImplementation(async (r) => r);
    (slotLockRepository.acquireLocks as jest.Mock).mockResolvedValue(true);
  });

  // ═══════════════════════════════════════════════════════════
  // 1. DATA INTEGRITY & DEMO SUITABILITY
  // ═══════════════════════════════════════════════════════════
  describe('Seed Data Integrity', () => {
    it('should provide demo users across all roles without sensitive data', () => {
      expect(demoUsers.length).toBeGreaterThanOrEqual(10);

      const drivers = demoUsers.filter((u) => u.role === 'DRIVER');
      const hosts = demoUsers.filter((u) => u.role === 'HOST');
      const admins = demoUsers.filter((u) => u.role === 'ADMIN');

      expect(drivers.length).toBeGreaterThanOrEqual(3);
      expect(hosts.length).toBeGreaterThanOrEqual(5);
      expect(admins.length).toBeGreaterThanOrEqual(1);

      // All emails must be demo domains
      for (const u of demoUsers) {
        expect(u.email).toMatch(/demo\.parkkaro\.com/);
        expect(u.userId).toBeDefined();
        expect(u.status).toBe('ACTIVE');
      }
    });

    it('should provide diverse listings across Bengaluru neighborhoods', () => {
      expect(demoListings.length).toBeGreaterThanOrEqual(25);

      const hostIds = new Set(demoUsers.filter((u) => u.role === 'HOST').map((h) => h.userId));
      const areas = new Set(demoListings.map((l) => l.area));

      // Covers major tech hubs and central areas
      expect(areas.has('Koramangala')).toBe(true);
      expect(areas.has('Indiranagar')).toBe(true);
      expect(areas.has('HSR Layout')).toBe(true);
      expect(areas.has('Whitefield')).toBe(true);
      expect(areas.has('Electronic City')).toBe(true);
      expect(areas.has('MG Road')).toBe(true);
      expect(areas.size).toBeGreaterThanOrEqual(8);

      // Verify listing validity and host reference integrity
      for (const listing of demoListings) {
        expect(hostIds.has(listing.hostId)).toBe(true);
        expect(listing.pricePerHour).toBeGreaterThan(0);
        expect(listing.capacity).toBeGreaterThanOrEqual(1);
        expect(listing.latitude).toBeGreaterThan(12.0);
        expect(listing.longitude).toBeGreaterThan(77.0);
        expect(listing.vehicleTypes.length).toBeGreaterThanOrEqual(1);
        expect(listing.amenities).toBeDefined();
        expect(listing.availability).toBeDefined();
        expect(listing.status).toBe('ACTIVE');
      }
    });

    it('should have price and feature diversity for testing search filters', () => {
      const budgetListings = demoListings.filter((l) => l.pricePerHour <= 35);
      const premiumListings = demoListings.filter((l) => l.pricePerHour >= 70);
      const evListings = demoListings.filter((l) => l.amenities.includes('evCharging'));
      const coveredListings = demoListings.filter((l) => l.parkingType === 'COVERED' || l.parkingType === 'BASEMENT');
      const roundTheClockListings = demoListings.filter((l) => l.amenities.includes('24x7'));

      expect(budgetListings.length).toBeGreaterThanOrEqual(3);
      expect(premiumListings.length).toBeGreaterThanOrEqual(3);
      expect(evListings.length).toBeGreaterThanOrEqual(3);
      expect(coveredListings.length).toBeGreaterThanOrEqual(5);
      expect(roundTheClockListings.length).toBeGreaterThanOrEqual(5);
    });

    it('should link vehicles to valid driver accounts', () => {
      const driverIds = new Set(demoUsers.filter((u) => u.role === 'DRIVER').map((d) => d.userId));
      expect(demoVehicles.length).toBeGreaterThanOrEqual(3);

      for (const vehicle of demoVehicles) {
        expect(driverIds.has(vehicle.userId)).toBe(true);
        expect(vehicle.vehicleNumber).toBeDefined();
        expect(['CAR', 'BIKE', 'SUV', 'EV', 'TRUCK']).toContain(vehicle.vehicleType);
      }
    });

    it('should link favorites to valid drivers and listings without duplicates', () => {
      const driverIds = new Set(demoUsers.filter((u) => u.role === 'DRIVER').map((d) => d.userId));
      const listingIds = new Set(demoListings.map((l) => l.listingId));

      const seen = new Set<string>();
      for (const fav of demoFavorites) {
        expect(driverIds.has(fav.userId)).toBe(true);
        expect(listingIds.has(fav.listingId)).toBe(true);

        const pair = `${fav.userId}#${fav.listingId}`;
        expect(seen.has(pair)).toBe(false);
        seen.add(pair);
      }
    });

    it('should have valid bookings and corresponding payments and reviews', () => {
      const driverIds = new Set(demoUsers.filter((u) => u.role === 'DRIVER').map((d) => d.userId));
      const hostIds = new Set(demoUsers.filter((u) => u.role === 'HOST').map((h) => h.userId));
      const listingIds = new Set(demoListings.map((l) => l.listingId));

      const statuses = new Set(demoBookings.map((b) => b.bookingStatus));
      expect(statuses.has('COMPLETED')).toBe(true);
      expect(statuses.has('CONFIRMED')).toBe(true);
      expect(statuses.has('CANCELLED')).toBe(true);

      for (const b of demoBookings) {
        expect(driverIds.has(b.driverId)).toBe(true);
        expect(hostIds.has(b.hostId)).toBe(true);
        expect(listingIds.has(b.listingId)).toBe(true);
        expect(b.totalAmount).toBeGreaterThan(0);
      }

      // Reviews only for completed bookings
      const completedBookingIds = new Set(
        demoBookings.filter((b) => b.bookingStatus === 'COMPLETED').map((b) => b.bookingId)
      );
      for (const review of demoReviews) {
        expect(completedBookingIds.has(review.bookingId)).toBe(true);
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. SEED SCRIPT EXECUTION
  // ═══════════════════════════════════════════════════════════
  describe('seedDatabase() execution', () => {
    it('should successfully execute seed and populate all entity repositories', async () => {
      const result = await seedDatabase();

      expect(result.users).toBe(demoUsers.length);
      expect(result.listings).toBe(demoListings.length);
      expect(result.vehicles).toBe(demoVehicles.length);
      expect(result.favorites).toBe(demoFavorites.length);
      expect(result.bookings).toBe(demoBookings.length);
      expect(result.payments).toBe(demoPayments.length);
      expect(result.payouts).toBe(demoPayouts.length);
      expect(result.reviews).toBe(demoReviews.length);
      expect(result.notifications).toBe(demoNotifications.length);
      expect(result.conversations).toBe(demoConversations.length);
      expect(result.messages).toBe(demoMessages.length);
      expect(result.disputes).toBe(demoDisputes.length);
      expect(result.reports).toBe(demoReports.length);

      // Verify repository calls
      expect(userRepository.create).toHaveBeenCalledTimes(demoUsers.length);
      expect(parkingRepository.create).toHaveBeenCalledTimes(demoListings.length);
      expect(vehicleRepository.create).toHaveBeenCalledTimes(demoVehicles.length);
      expect(favoriteRepository.add).toHaveBeenCalledTimes(demoFavorites.length);
      expect(bookingRepository.create).toHaveBeenCalledTimes(demoBookings.length);
      expect(paymentRepository.create).toHaveBeenCalledTimes(demoPayments.length);
      expect(payoutRepository.create).toHaveBeenCalledTimes(demoPayouts.length);
      expect(reviewRepository.create).toHaveBeenCalledTimes(demoReviews.length);
      expect(notificationRepository.create).toHaveBeenCalledTimes(demoNotifications.length);
      expect(conversationRepository.create).toHaveBeenCalledTimes(demoConversations.length);
      expect(messageRepository.create).toHaveBeenCalledTimes(demoMessages.length);
      expect(disputeRepository.create).toHaveBeenCalledTimes(demoDisputes.length);
      expect(reportRepository.create).toHaveBeenCalledTimes(demoReports.length);
    });
  });
});
