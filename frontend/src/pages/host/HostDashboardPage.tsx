import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { hostApi } from '../../api/host';
import { HostDashboardStats } from '../../types/api';
import {
  Layers,
  CalendarCheck,
  TrendingUp,
  Star,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export const HostDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<HostDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hostApi
      .getDashboard()
      .then((data) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout type="host" title="Host Dashboard">
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-white rounded-3xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="host"
      title="Host Revenue & Space Hub"
      subtitle="Monitor your Bengaluru parking listings, guest check-ins, occupancy rates, and weekly payouts."
      action={
        <Link
          to="/host/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>List Another Space</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Earnings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              ₹{stats.monthlyEarnings.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Total lifetime: ₹{stats.totalEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Listings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats.activeListings} / {stats.totalListings}
            </p>
            <Link
              to="/host/listings"
              className="text-[11px] text-blue-600 font-semibold mt-0.5 block hover:underline"
            >
              Manage spaces &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Upcoming Bookings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {stats.upcomingBookings}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {stats.activeBookings} guest currently parked
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Occupancy & Rating
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {Math.round(stats.occupancyRate * 100)}%
              </p>
              <div className="flex items-center text-xs font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                <span>{stats.averageRating}</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {stats.completedBookings} total visits
            </span>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Recent Guest Check-ins</h3>
            <Link
              to="/host/earnings"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View full financial breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Guest</th>
                  <th className="pb-3 font-semibold">Space</th>
                  <th className="pb-3 font-semibold">Time Window</th>
                  <th className="pb-3 font-semibold">Payout</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentBookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 font-bold text-slate-900">{b.driverName}</td>
                    <td className="py-3.5 text-slate-600 font-medium">{b.listingTitle}</td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(b.startTime).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      {new Date(b.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 font-black text-emerald-600">
                      ₹{Math.round(b.amount * 0.9)}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Host Quick Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/host/listings"
            className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 shadow-xs transition block group"
          >
            <Building className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm">Manage Listed Spaces</h4>
            <p className="text-xs text-slate-500 mt-1">
              Toggle availability, update pricing, or edit operating hours.
            </p>
          </Link>

          <Link
            to="/host/earnings"
            className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 shadow-xs transition block group"
          >
            <TrendingUp className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm">Payouts & Tax Invoices</h4>
            <p className="text-xs text-slate-500 mt-1">
              Review direct deposit bank receipts and request immediate withdrawal.
            </p>
          </Link>

          <Link
            to="/driver/messages"
            className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 shadow-xs transition block group"
          >
            <ShieldCheck className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm">Guest Support & Claims</h4>
            <p className="text-xs text-slate-500 mt-1">
              Direct communication with guests and 24/7 ParkKaro assistance.
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};
