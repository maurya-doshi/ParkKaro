import { apiClient } from './client';
import { Booking, CreateBookingRequest } from '../types/booking';
import { PaginatedData } from '../types/api';
import { DEMO_BOOKINGS } from './mockData';
import { parkingApi } from './parking';

const MOCK_STORAGE_KEY = 'parkshare_demo_bookings';

function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock bookings', e);
  }
  return [...DEMO_BOOKINGS];
}

function saveStoredBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error('Error saving mock bookings', e);
  }
}

export const bookingsApi = {
  async list(status?: string): Promise<PaginatedData<Booking>> {
    try {
      const res = await apiClient.get<PaginatedData<Booking>>('/bookings', { status });
      if (res.success && res.data?.items) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    let bookings = getStoredBookings();
    if (status) {
      bookings = bookings.filter((b) => b.bookingStatus === status);
    }

    return {
      items: bookings,
      pagination: {
        count: bookings.length,
        total: bookings.length,
        nextToken: null,
        limit: 20
      }
    };
  },

  async getById(id: string): Promise<Booking> {
    try {
      const res = await apiClient.get<Booking>(`/bookings/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const booking = getStoredBookings().find((b) => b.bookingId === id);
    if (!booking) {
      throw new Error(`Booking '${id}' not found`);
    }
    return booking;
  },

  async create(req: CreateBookingRequest): Promise<Booking> {
    try {
      const res = await apiClient.post<Booking>('/bookings', req);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const listing = await parkingApi.getById(req.listingId);
    const startHour = parseInt(req.startTime.split(':')[0]);
    const endHour = parseInt(req.endTime.split(':')[0]);
    const durationHours = Math.max(1, endHour - startHour);

    const baseAmount = listing.pricePerHour * durationHours;
    const platformFee = Math.round(baseAmount * 0.1);
    const totalAmount = baseAmount + platformFee;
    const hostEarnings = baseAmount - platformFee;

    const bookingId = `booking_${Date.now().toString(36)}`;
    const randomCode = `PK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      bookingId,
      listingId: listing.listingId,
      listingTitle: listing.title,
      listingAddress: listing.address,
      listingArea: listing.area,
      hostId: listing.hostId,
      hostName: 'Host Partner',
      driverId: 'user_driver1',
      driverName: 'Arjun Verma',
      vehicleId: req.vehicleId,
      vehicleNumber: 'KA-01-MJ-4521',
      vehicleModel: 'Hyundai Creta',
      startTime: `${req.date}T${req.startTime}:00.000Z`,
      endTime: `${req.date}T${req.endTime}:00.000Z`,
      durationHours,
      baseAmount,
      platformFee,
      tax: 0,
      totalAmount,
      hostEarnings,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrData: `PARKSHARE-AUTH:${bookingId}:${listing.listingId}:user_driver1:CONFIRMED`,
      qrVerificationCode: randomCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const current = getStoredBookings();
    saveStoredBookings([newBooking, ...current]);
    return newBooking;
  },

  async cancel(id: string, reason: string = 'Plans changed'): Promise<Booking> {
    try {
      const res = await apiClient.post<{ bookingId: string; bookingStatus: string }>(
        `/bookings/${id}/cancel`,
        { reason }
      );
      if (res.success) {
        return await this.getById(id);
      }
    } catch {
      // Fallback
    }

    const current = getStoredBookings();
    const index = current.findIndex((b) => b.bookingId === id);
    if (index === -1) throw new Error('Booking not found');

    const updated: Booking = {
      ...current[index],
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancellationReason: reason,
      cancelledBy: 'user_driver1',
      cancelledAt: new Date().toISOString(),
      refundAmount: current[index].totalAmount
    };

    current[index] = updated;
    saveStoredBookings(current);
    return updated;
  },

  async complete(id: string): Promise<Booking> {
    try {
      const res = await apiClient.post<Booking>(`/bookings/${id}/complete`);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const current = getStoredBookings();
    const index = current.findIndex((b) => b.bookingId === id);
    if (index === -1) throw new Error('Booking not found');

    const updated: Booking = {
      ...current[index],
      bookingStatus: 'COMPLETED'
    };

    current[index] = updated;
    saveStoredBookings(current);
    return updated;
  }
};
