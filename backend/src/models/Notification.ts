/**
 * Notification model — corresponds to parkshare-notifications table.
 */

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_UPCOMING'
  | 'PAYMENT_UPDATE'
  | 'NEW_HOST_BOOKING'
  | 'REVIEW_REMINDER'
  | 'DISPUTE_UPDATE'
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
