import { notificationRepository } from '../repositories/notificationRepository';
import { Notification, CreateNotificationInput } from '../models/Notification';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class NotificationService {
  /**
   * Create a notification (internal use by other services).
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    return notificationRepository.create(input);
  }

  /**
   * Get notifications for the authenticated user (paginated, newest first).
   */
  async listNotifications(
    userId: string,
    limit = 50
  ): Promise<{ items: Notification[]; pagination: { count: number; limit: number; nextToken: null } }> {
    const items = await notificationRepository.findByUserId(userId, limit);
    return {
      items,
      pagination: { count: items.length, limit, nextToken: null },
    };
  }

  /**
   * Get unread notification count for the user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark a single notification as read. Enforces ownership.
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    // Verify ownership by fetching the user's notifications
    const notifications = await notificationRepository.findByUserId(userId, 200);
    const found = notifications.find((n) => n.notificationId === notificationId);
    if (!found) {
      throw new NotFoundError('Notification', notificationId);
    }
    if (found.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this notification');
    }
    await notificationRepository.markAsRead(userId, notificationId);
  }

  /**
   * Mark all notifications as read for the user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
