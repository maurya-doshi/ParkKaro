import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { AdminAnalytics } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Users,
  Building2,
  TrendingUp,
  Calendar,
  Star,
  DollarSign,
  ShieldAlert,
  Activity,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { role } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-sm text-slate-500 mt-2">You need admin privileges to view this page.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline text-sm font-semibold">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: analytics?.totalUsers.toLocaleString('en-IN'),
      sub: `${analytics?.totalDrivers} drivers · ${analytics?.totalHosts} hosts`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Active Listings',
      value: analytics?.activeListings,
      sub: `${analytics?.totalListings} total listings`,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Total Bookings',
      value: analytics?.totalBookings.toLocaleString('en-IN'),
      sub: `${analytics?.bookingsToday} bookings today`,
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Platform Revenue',
      value: `₹${analytics?.platformEarnings.toLocaleString('en-IN')}`,
      sub: `₹${analytics?.revenueToday?.toLocaleString('en-IN')} today (10%)`,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Avg. Rating',
      value: analytics?.averageRating,
      sub: 'Across all listings',
      icon: Star,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      label: 'Total Revenue (GMV)',
      value: `₹${analytics?.totalRevenue.toLocaleString('en-IN')}`,
      sub: 'Gross marketplace volume',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <DashboardLayout
      type="admin"
      title="Platform Operations"
      subtitle="Real-time overview of ParkKaro Bengaluru — users, listings, bookings, and revenue."
    >
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-28 bg-white rounded-3xl border" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
                <p className={`text-2xl font-black ${s.color} mt-0.5`}>{s.value}</p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Platform Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'User Management', desc: 'View, verify, or suspend users', to: '/admin/users', icon: Users, color: 'blue' },
                { label: 'Listings Review', desc: 'Approve, flag, or remove listings', to: '/admin/listings', icon: Building2, color: 'indigo' },
                { label: 'Disputes & Claims', desc: 'Resolve open driver/host disputes', to: '/admin/disputes', icon: ShieldAlert, color: 'rose' }
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                      <link.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{link.label}</p>
                      <p className="text-[11px] text-slate-500">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
                </Link>
              ))}
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              System Health — All Services Operational
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'API Gateway', status: 'Healthy', latency: '42ms' },
                { name: 'DynamoDB', status: 'Healthy', latency: '8ms' },
                { name: 'Cognito Auth', status: 'Healthy', latency: '120ms' },
                { name: 'Bedrock AI', status: 'Healthy', latency: '850ms' }
              ].map((svc) => (
                <div key={svc.name} className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{svc.status}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{svc.name}</p>
                  <p className="text-[11px] text-slate-500">Latency: {svc.latency}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
