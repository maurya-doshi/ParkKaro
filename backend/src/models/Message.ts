/**
 * Message model — corresponds to parkshare-messages table.
 */

export interface Message {
  conversationId: string;
  messageId: string; // Sort key: {timestamp}#{uuid}
  senderId: string;
  content: string;
  createdAt: string;
}

export interface SendMessageInput {
  content: string;
}
