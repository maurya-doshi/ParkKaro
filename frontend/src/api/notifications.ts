import { apiClient } from './client';
import { NotificationItem } from '../types/message';

export const notificationsApi = {
  /**
   * List user notifications
   * GET /notifications
   */
  async list(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
    const res = await apiClient.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications');
    if (res && res.data) {
      return {
        items: Array.isArray(res.data.items) ? res.data.items : [],
        unreadCount: typeof res.data.unreadCount === 'number' ? res.data.unreadCount : 0
      };
    }
    return { items: [], unreadCount: 0 };
  },

  /**
   * Mark a notification as read
   * POST /notifications/{id}/read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const res = await apiClient.post<{ message: string }>(`/notifications/${encodeURIComponent(notificationId)}/read`);
    return !!res?.success;
  },

  /**
   * Mark all notifications as read by marking unread items
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { items } = await this.list();
      const unread = items.filter((n) => !n.read);
      await Promise.all(unread.map((n) => this.markAsRead(n.notificationId)));
      return true;
    } catch {
      return false;
    }
  }
};
