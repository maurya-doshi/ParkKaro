/**
 * Conversation model — corresponds to parkshare-conversations table.
 */

export interface Conversation {
  conversationId: string;
  participants: string[];
  participant1: string; // for GSI
  participant2: string; // for GSI
  listingId?: string;
  bookingId?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}
