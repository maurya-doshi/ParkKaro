import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Car,
  CalendarCheck,
  Heart,
  MessageSquare,
  Bell,
  Layers,
  PlusCircle,
  TrendingUp,
  Shield,
  Users,
  FileText,
  AlertTriangle,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  type: 'driver' | 'host' | 'admin';
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ type }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const driverLinks = [
    { to: '/driver/dashboard', label: 'Overview', icon: Car },
    { to: '/driver/bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/driver/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/driver/favorites', label: 'Saved Spots', icon: Heart },
    { to: '/driver/messages', label: 'Messages', icon: MessageSquare },
    { to: '/driver/notifications', label: 'Notifications', icon: Bell }
  ];

  const hostLinks = [
    { to: '/host/dashboard', label: 'Host Overview', icon: Layers },
    { to: '/host/listings', label: 'My Listings', icon: Layers },
    { to: '/host/create', label: 'List New Space', icon: PlusCircle },
    { to: '/host/earnings', label: 'Earnings & Payouts', icon: TrendingUp },
    { to: '/driver/messages', label: 'Guest Messages', icon: MessageSquare }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Analytics Hub', icon: Shield },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/listings', label: 'Listing Moderation', icon: Layers },
    { to: '/admin/disputes', label: 'Disputes & Claims', icon: AlertTriangle },
    { to: '/admin/reports', label: 'Platform Reports', icon: FileText }
  ];

  const links = type === 'host' ? hostLinks : type === 'admin' ? adminLinks : driverLinks;

  return (
    <aside className="w-full md:w-64 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs shrink-0">
      {/* Mini Profile Header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
        <img
          src={
            user?.profileImage ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
          }
          alt={user?.name}
          className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
            {type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
            </Link>
          );
        })}
      </nav>

      {/* Switch Hub shortcut */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
          Switch Persona
        </span>
        <div className="space-y-1 text-xs">
          {type !== 'driver' && (
            <Link
              to="/driver/dashboard"
              className="block px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
            >
              &rarr; Driver Hub
            </Link>
          )}
          {type !== 'host' && (
            <Link
              to="/host/dashboard"
              className="block px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
            >
              &rarr; Host Hub
            </Link>
          )}
          {type !== 'admin' && (
            <Link
              to="/admin/dashboard"
              className="block px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
            >
              &rarr; Admin Hub
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};
