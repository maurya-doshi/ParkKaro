/**
 * Notification model — corresponds to parkkaro-notifications table.
 */

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_UPCOMING'
  | 'PAYMENT_UPDATE'
  | 'NEW_HOST_BOOKING'
  | 'REVIEW_REMINDER'
  | 'REVIEW_RECEIVED'
  | 'DISPUTE_UPDATE'
  | 'PAYOUT_UPDATE'
  | 'NEW_MESSAGE'
  | 'SYSTEM';

export interface Notification {
  userId: string;
  notificationId: string; // Sort key: {timestamp}#{uuid}
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
}
