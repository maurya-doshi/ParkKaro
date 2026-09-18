export interface Conversation {
  conversationId: string;
  participants: string[];
  participantNames?: Record<string, string>;
  listingId: string;
  listingTitle?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  notificationId: string;
  type:
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_UPCOMING'
    | 'PAYMENT_UPDATE'
    | 'NEW_HOST_BOOKING'
    | 'REVIEW_REMINDER'
    | 'DISPUTE_UPDATE'
    | 'SYSTEM';
  title: string;
  message: string;
  data?: {
    bookingId?: string;
    listingId?: string;
    [key: string]: unknown;
  };
  read: boolean;
  createdAt: string;
}
