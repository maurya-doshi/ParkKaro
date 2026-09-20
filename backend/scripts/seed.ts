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
} from './seedData';

export interface SeedResult {
  users: number;
  listings: number;
  vehicles: number;
  favorites: number;
  bookings: number;
  payments: number;
  payouts: number;
  reviews: number;
  notifications: number;
  conversations: number;
  messages: number;
  disputes: number;
  reports: number;
}

/**
 * Deterministic seed script for local development and AWS staging.
 */
export async function seedDatabase(): Promise<SeedResult> {
  console.log('🌱 Starting ParkShare deterministic database seed...');

  // 1. Users
  console.log(`👤 Seeding ${demoUsers.length} demo users...`);
  for (const user of demoUsers) {
    await userRepository.create(user);
  }

  // 2. Parking Listings
  console.log(`🅿️  Seeding ${demoListings.length} demo parking listings across Bengaluru...`);
  for (const listing of demoListings) {
    await parkingRepository.create(listing);
  }

  // 3. Vehicles
  console.log(`🚗 Seeding ${demoVehicles.length} demo vehicles...`);
  for (const vehicle of demoVehicles) {
    await vehicleRepository.create(vehicle);
  }

  // 4. Favorites
  console.log(`⭐ Seeding ${demoFavorites.length} demo favorites...`);
  for (const fav of demoFavorites) {
    await favoriteRepository.add(fav.userId, fav.listingId);
  }

  // 5. Bookings & Slot Locks
  console.log(`📅 Seeding ${demoBookings.length} demo bookings...`);
  for (const booking of demoBookings) {
    await bookingRepository.create(booking);

    // Acquire slot lock for active/confirmed bookings
    if (booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'ACTIVE') {
      const date = booking.startTime.substring(0, 10);
      const startHour = parseInt(booking.startTime.substring(11, 13), 10);
      const endHour = parseInt(booking.endTime.substring(11, 13), 10);

      const locks = [];
      for (let h = startHour; h < endHour; h++) {
        const slotKey = `${date}#${h * 2}#space0`;
        locks.push({
          listingId: booking.listingId,
          slotKey,
          bookingId: booking.bookingId,
          driverId: booking.driverId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: 'BOOKED' as const,
          createdAt: booking.createdAt,
        });
      }
      if (locks.length > 0) {
        try {
          await slotLockRepository.acquireLocks(locks);
        } catch {
          // Non-blocking in seed mode
        }
      }
    }
  }

  // 6. Payments
  console.log(`💳 Seeding ${demoPayments.length} demo payments...`);
  for (const payment of demoPayments) {
    await paymentRepository.create(payment);
  }

  // 7. Payouts
  console.log(`💰 Seeding ${demoPayouts.length} demo payouts...`);
  for (const payout of demoPayouts) {
    await payoutRepository.create(payout);
  }

  // 8. Reviews
  console.log(`✍️  Seeding ${demoReviews.length} demo reviews...`);
  for (const review of demoReviews) {
    await reviewRepository.create(review);
  }

  // 9. Notifications
  console.log(`🔔 Seeding ${demoNotifications.length} demo notifications...`);
  for (const notif of demoNotifications) {
    await notificationRepository.create({
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data,
    });
  }

  // 10. Conversations & Messages
  console.log(`💬 Seeding ${demoConversations.length} demo conversation(s) and ${demoMessages.length} message(s)...`);
  for (const conv of demoConversations) {
    await conversationRepository.create(conv);
  }
  for (const msg of demoMessages) {
    await messageRepository.create(msg);
  }

  // 11. Disputes & Reports
  console.log(`⚖️  Seeding demo disputes (${demoDisputes.length}) and reports (${demoReports.length})...`);
  for (const dispute of demoDisputes) {
    await disputeRepository.create(dispute);
  }
  for (const report of demoReports) {
    await reportRepository.create(report);
  }

  console.log('✅ ParkShare database seed complete!');

  return {
    users: demoUsers.length,
    listings: demoListings.length,
    vehicles: demoVehicles.length,
    favorites: demoFavorites.length,
    bookings: demoBookings.length,
    payments: demoPayments.length,
    payouts: demoPayouts.length,
    reviews: demoReviews.length,
    notifications: demoNotifications.length,
    conversations: demoConversations.length,
    messages: demoMessages.length,
    disputes: demoDisputes.length,
    reports: demoReports.length,
  };
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('Seed summary:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
