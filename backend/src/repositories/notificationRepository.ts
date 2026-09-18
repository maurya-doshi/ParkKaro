import { BaseRepository } from './baseRepository';
import { Notification, CreateNotificationInput } from '../models/Notification';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications');
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const timestamp = new Date().toISOString();
    const notificationId = `${timestamp}#${uuidv4()}`;

    const notification: Notification = {
      userId: input.userId,
      notificationId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      read: false,
      createdAt: timestamp,
    };

    return this.putItem(notification);
  }

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    return this.queryItems({
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.updateItem(
      { userId, notificationId },
      'SET #read = :read',
      { '#read': 'read' },
      { ':read': true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findByUserId(userId, 100);
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await this.markAsRead(userId, n.notificationId);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.findByUserId(userId, 100);
    return notifications.filter((n) => !n.read).length;
  }
}

export const notificationRepository = new NotificationRepository();
