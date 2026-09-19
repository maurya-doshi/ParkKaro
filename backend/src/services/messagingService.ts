import { v4 as uuidv4 } from 'uuid';
import { conversationRepository } from '../repositories/conversationRepository';
import { messageRepository } from '../repositories/messageRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export class MessagingService {
  /**
   * Get or create a conversation between two users (idempotent).
   */
  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    listingId?: string,
    bookingId?: string
  ): Promise<Conversation> {
    if (userId === otherUserId) {
      throw new ValidationError('You cannot start a conversation with yourself');
    }

    // Check if conversation already exists (either direction)
    const existing = await conversationRepository.findByUser(userId);
    const found = existing.find(
      (c) =>
        (c.participant1 === userId && c.participant2 === otherUserId) ||
        (c.participant1 === otherUserId && c.participant2 === userId)
    );
    if (found) return found;

    const conversationId = `conv_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    const conversation: Conversation = {
      conversationId,
      participants: [userId, otherUserId],
      participant1: userId,
      participant2: otherUserId,
      listingId,
      bookingId,
      lastMessageAt: timestamp,
      lastMessagePreview: '',
      createdAt: timestamp,
    };

    return conversationRepository.create(conversation);
  }

  /**
   * Get a conversation by ID with participant authorization.
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }
    this.assertParticipant(conversation, userId);
    return conversation;
  }

  /**
   * List all conversations for the authenticated user.
   */
  async listConversations(userId: string): Promise<Conversation[]> {
    return conversationRepository.findByUser(userId);
  }

  /**
   * Send a message in a conversation. Sender must be a participant.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }
    if (content.length > 2000) {
      throw new ValidationError('Message cannot exceed 2000 characters');
    }

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }
    this.assertParticipant(conversation, senderId);

    const timestamp = new Date().toISOString();
    const messageId = `${timestamp}#${uuidv4()}`;

    const message: Message = {
      conversationId,
      messageId,
      senderId,
      content: content.trim(),
      createdAt: timestamp,
    };

    await messageRepository.create(message);

    // Update conversation preview
    const preview = content.length > 80 ? content.substring(0, 80) + '…' : content;
    await conversationRepository.updateLastMessage(conversationId, preview, timestamp);

    // Notify recipient
    const recipientId = conversation.participants.find((p) => p !== senderId);
    if (recipientId) {
      try {
        await notificationRepository.create({
          userId: recipientId,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: preview,
          data: { conversationId, senderId },
        });
      } catch {
        // Non-critical
      }
    }

    return message;
  }

  /**
   * Get messages for a conversation. Caller must be a participant.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit = 100
  ): Promise<Message[]> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }
    this.assertParticipant(conversation, userId);
    return messageRepository.findByConversationId(conversationId, limit);
  }

  /**
   * Assert that userId is a participant in the conversation.
   */
  private assertParticipant(conversation: Conversation, userId: string): void {
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }
  }
}

export const messagingService = new MessagingService();
