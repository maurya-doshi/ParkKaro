import { apiClient } from './client';
import { NotificationItem } from '../types/message';
import { DEMO_NOTIFICATIONS } from './mockData';

const MOCK_STORAGE_KEY = 'parkshare_demo_notifications';

function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading notifications', e);
  }
  return [...DEMO_NOTIFICATIONS];
}

function saveStoredNotifications(items: NotificationItem[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving notifications', e);
  }
}

export const notificationsApi = {
  async list(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
    try {
      const res = await apiClient.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications');
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }

    const items = getStoredNotifications();
    const unreadCount = items.filter((n) => !n.read).length;
    return { items, unreadCount };
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await apiClient.post<{ message: string }>(`/notifications/${notificationId}/read`);
      if (res.success) return true;
    } catch {
      // Fallback
    }

    const items = getStoredNotifications();
    const updated = items.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n));
    saveStoredNotifications(updated);
    return true;
  },

  async markAllAsRead(): Promise<boolean> {
    const items = getStoredNotifications();
    const updated = items.map((n) => ({ ...n, read: true }));
    saveStoredNotifications(updated);
    return true;
  }
};
