/**
 * Booking model — corresponds to parkshare-bookings table.
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Booking {
  bookingId: string;
  listingId: string;
  hostId: string;
  driverId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  baseAmount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  hostEarnings: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  qrData: string;
  qrVerificationCode: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  listingId: string;
  vehicleId: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
}

export interface CancelBookingInput {
  reason?: string;
}

/**
 * Valid booking status transitions.
 */
export const VALID_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED', 'DISPUTED'],
  ACTIVE: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['RESOLVED' as any], // resolved goes back to appropriate state
};
