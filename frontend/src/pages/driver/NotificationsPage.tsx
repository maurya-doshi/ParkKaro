import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types/message';
import { Bell, CheckCircle2, Check, Clock, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const handleMarkOne = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
    );
  };

  return (
    <DashboardLayout
      type="driver"
      title="Notification Center"
      subtitle="Real-time alerts for booking confirmations, upcoming session reminders, and payment receipts."
      action={
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      }
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.notificationId}
              onClick={() => handleMarkOne(notif.notificationId)}
              className={`p-5 flex items-start justify-between gap-4 cursor-pointer transition ${
                !notif.read ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    !notif.read ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
