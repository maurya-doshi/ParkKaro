import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types/message';
import {
  Car,
  Bell,
  Heart,
  User as UserIcon,
  Shield,
  Layers,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenAI?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAI }) => {
  const { user, role, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.list().then((res) => {
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    });
  }, [location.pathname]);

  const handleMarkNotificationRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-950 flex items-center gap-1">
                Park<span className="text-blue-600">Share</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">
                Bengaluru Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
            <Link
              to="/search"
              className={`px-3 py-1.5 rounded-lg transition hover:text-blue-600 hover:bg-slate-50 ${
                location.pathname === '/search' ? 'text-blue-600 bg-blue-50/70 font-bold' : ''
              }`}
            >
              Find Parking
            </Link>
            <Link
              to="/become-host"
              className={`px-3 py-1.5 rounded-lg transition hover:text-blue-600 hover:bg-slate-50 ${
                location.pathname === '/become-host' ? 'text-blue-600 bg-blue-50/70 font-bold' : ''
              }`}
            >
              Host a Space
            </Link>
            {role === 'DRIVER' && (
              <Link
                to="/driver/dashboard"
                className={`px-3 py-1.5 rounded-lg transition hover:text-blue-600 hover:bg-slate-50 ${
                  location.pathname.startsWith('/driver') ? 'text-blue-600 bg-blue-50/70 font-bold' : ''
                }`}
              >
                Driver Hub
              </Link>
            )}
            {role === 'HOST' && (
              <Link
                to="/host/dashboard"
                className={`px-3 py-1.5 rounded-lg transition hover:text-blue-600 hover:bg-slate-50 ${
                  location.pathname.startsWith('/host') ? 'text-blue-600 bg-blue-50/70 font-bold' : ''
                }`}
              >
                Host Dashboard
              </Link>
            )}
            {role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg transition hover:text-blue-600 hover:bg-slate-50 ${
                  location.pathname.startsWith('/admin') ? 'text-blue-600 bg-blue-50/70 font-bold' : ''
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions & Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Assistant Quick Trigger */}
          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200/60 transition shadow-sm"
              title="Open AI Bedrock Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}

          {/* Quick Demo Role Switcher Pill */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2">Role:</span>
            <button
              type="button"
              onClick={() => switchRole('DRIVER')}
              className={`px-2.5 py-1 rounded-lg transition ${
                role === 'DRIVER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => switchRole('HOST')}
              className={`px-2.5 py-1 rounded-lg transition ${
                role === 'HOST' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Host
            </button>
            <button
              type="button"
              onClick={() => switchRole('ADMIN')}
              className={`px-2.5 py-1 rounded-lg transition ${
                role === 'ADMIN' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Favorites (Driver) */}
          <Link
            to="/driver/favorites"
            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition"
            title="Saved spots"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[11px] text-blue-600 font-semibold">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.notificationId}
                      onClick={() => handleMarkNotificationRead(notif.notificationId)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition flex items-start gap-2.5 ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{notif.title}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pt-2 border-t border-slate-100 text-center">
                  <Link
                    to="/driver/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View all notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none"
            >
              <img
                src={
                  user?.profileImage ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
                }
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                    {role} View
                  </span>
                </div>

                <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                  <Link
                    to="/driver/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Car className="w-4 h-4 text-slate-400" />
                    Driver Dashboard
                  </Link>
                  <Link
                    to="/host/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    Host Dashboard
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Admin Dashboard
                  </Link>
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold justify-around mb-2">
            <button
              onClick={() => {
                switchRole('DRIVER');
                setMobileMenuOpen(false);
              }}
              className={`flex-1 py-1.5 rounded-lg ${role === 'DRIVER' ? 'bg-white text-blue-600 shadow' : ''}`}
            >
              Driver
            </button>
            <button
              onClick={() => {
                switchRole('HOST');
                setMobileMenuOpen(false);
              }}
              className={`flex-1 py-1.5 rounded-lg ${role === 'HOST' ? 'bg-white text-blue-600 shadow' : ''}`}
            >
              Host
            </button>
            <button
              onClick={() => {
                switchRole('ADMIN');
                setMobileMenuOpen(false);
              }}
              className={`flex-1 py-1.5 rounded-lg ${role === 'ADMIN' ? 'bg-white text-purple-600 shadow' : ''}`}
            >
              Admin
            </button>
          </div>

          <div className="flex flex-col space-y-1 font-semibold text-sm text-slate-700">
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Find Parking
            </Link>
            <Link
              to="/become-host"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Host a Space
            </Link>
            <Link
              to="/driver/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Driver Hub
            </Link>
            <Link
              to="/host/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Host Dashboard
            </Link>
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
