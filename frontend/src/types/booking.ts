export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Booking {
  bookingId: string;
  listingId: string;
  listingTitle?: string;
  listingAddress?: string;
  listingArea?: string;
  hostId: string;
  hostName?: string;
  driverId: string;
  driverName?: string;
  vehicleId: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
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
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  listingId: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface BookingSummary {
  hours: number;
  ratePerHour: number;
  baseAmount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
}
