import { apiClient } from './client';
import { DriverDashboardStats } from '../types/api';
import { bookingsApi } from './bookings';
import { vehiclesApi } from './vehicles';
import { favoritesApi } from './favorites';
import { notificationsApi } from './notifications';

export const driverApi = {
  async getDashboard(): Promise<DriverDashboardStats> {
    try {
      const res = await apiClient.get<DriverDashboardStats>('/driver/dashboard');
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const { items: bookings } = await bookingsApi.list();
    const vehicles = await vehiclesApi.list();
    const favorites = await favoritesApi.list();
    const notifs = await notificationsApi.list();

    const active = bookings.find((b) => b.bookingStatus === 'ACTIVE') || null;
    const upcoming = bookings.filter((b) => b.bookingStatus === 'CONFIRMED');
    const past = bookings.filter((b) => b.bookingStatus === 'COMPLETED' || b.bookingStatus === 'CANCELLED');

    return {
      upcomingBookings: upcoming.map((b) => ({
        bookingId: b.bookingId,
        listingId: b.listingId,
        listingTitle: b.listingTitle || 'Parking Spot',
        listingAddress: b.listingAddress || 'Bengaluru',
        startTime: b.startTime,
        endTime: b.endTime,
        amount: b.totalAmount,
        bookingStatus: b.bookingStatus,
        qrVerificationCode: b.qrVerificationCode
      })),
      pastBookings: past.map((b) => ({
        bookingId: b.bookingId,
        listingId: b.listingId,
        listingTitle: b.listingTitle || 'Parking Spot',
        startTime: b.startTime,
        endTime: b.endTime,
        amount: b.totalAmount,
        bookingStatus: b.bookingStatus
      })),
      activeBooking: active
        ? {
            bookingId: active.bookingId,
            listingId: active.listingId,
            listingTitle: active.listingTitle || 'Parking Bay',
            listingAddress: active.listingAddress || 'Bengaluru',
            startTime: active.startTime,
            endTime: active.endTime,
            amount: active.totalAmount,
            bookingStatus: active.bookingStatus,
            qrVerificationCode: active.qrVerificationCode,
            latitude: 12.9352,
            longitude: 77.6245
          }
        : null,
      favoriteCount: favorites.length,
      vehicleCount: vehicles.length,
      reviewCount: 3,
      unreadNotifications: notifs.unreadCount
    };
  }
};
