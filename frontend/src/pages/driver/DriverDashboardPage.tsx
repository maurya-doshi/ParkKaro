import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { driverApi } from '../../api/driver';
import { DriverDashboardStats } from '../../types/api';
import { QRDisplay } from '../../components/booking/QRDisplay';
import {
  Car,
  Clock,
  MapPin,
  Calendar,
  QrCode,
  Heart,
  Navigation,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

export const DriverDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DriverDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState<any | null>(null);

  useEffect(() => {
    driverApi
      .getDashboard()
      .then((data) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout type="driver" title="Driver Hub">
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-white rounded-3xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-white rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const active = stats.activeBooking;

  return (
    <DashboardLayout
      type="driver"
      title="Driver Hub & Bookings"
      subtitle="Manage your active reservations, saved spots, and vehicle access passes."
      action={
        <Link
          to="/search"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
        >
          <Car className="w-3.5 h-3.5" />
          <span>Find Parking Now</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Active Booking Banner (if any) */}
        {active ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PARKING SESSION ACTIVE</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">{active.listingTitle}</h2>
                <p className="text-xs text-blue-200 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{active.listingAddress}</span>
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold text-blue-100 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-300" />
                    <span>
                      Until{' '}
                      {new Date(active.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-300 font-mono">PIN:</span>
                    <span className="font-mono font-black text-amber-300">
                      {active.qrVerificationCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedQRBooking(active)}
                  className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Display QR Pass</span>
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${active.latitude},${active.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-blue-700/80 hover:bg-blue-700 border border-blue-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">No Active Parking Session</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Headed somewhere in Bengaluru? Reserve your bay before departure to beat traffic.
              </p>
            </div>
            <Link
              to="/search"
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Search Spots
            </Link>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Upcoming
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(stats.upcomingBookings || []).length}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              Guaranteed slots
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed Trips
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats.completedBookings ?? (stats.pastBookings?.length ?? 0)}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Lifetime visits
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Saved Spots
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.favoriteCount ?? 0}</p>
            <Link
              to="/driver/favorites"
              className="text-[11px] text-blue-600 font-semibold mt-0.5 block hover:underline"
            >
              View favorites &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vehicles
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.vehicleCount ?? 0}</p>
            <Link
              to="/driver/vehicles"
              className="text-[11px] text-blue-600 font-semibold mt-0.5 block hover:underline"
            >
              Manage &rarr;
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Upcoming Reservations</h3>
            <Link
              to="/driver/bookings"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View all bookings &rarr;
            </Link>
          </div>

          {(stats.upcomingBookings || []).length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No upcoming bookings. Reserve a space ahead of your next trip.
            </div>
          ) : (
            <div className="space-y-3">
              {(stats.upcomingBookings || []).map((b) => (
                <div
                  key={b.bookingId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/60 transition gap-4"
                >
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mb-1">
                      {b.bookingStatus}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {b.listingTitle || 'Bengaluru Parking Slot'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {b.listingAddress || 'Bengaluru, Karnataka'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {new Date(b.startTime).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(b.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600">₹{b.totalAmount ?? b.amount ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQRBooking(b)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Show QR Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Past Bookings */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4">Past Bookings</h3>
          {((stats.pastBookings || stats.recentBookings || []).length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No completed trips recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {(stats.pastBookings || stats.recentBookings || []).map((b) => (
                <div key={b.bookingId} className="py-3.5 first:pt-0 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{b.listingTitle || 'Parking Spot'}</h4>
                    <span className="text-[11px] text-slate-400">
                      {new Date(b.startTime).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}{' '}
                      • ₹{b.totalAmount ?? b.amount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {b.bookingStatus || 'COMPLETED'}
                    </span>
                    <Link
                      to={`/parking/${b.listingId}`}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Rebook
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pass Modal */}
      {selectedQRBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedQRBooking(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-lg text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <QRDisplay
              bookingId={selectedQRBooking.bookingId}
              verificationCode={selectedQRBooking.qrVerificationCode}
              listingTitle={selectedQRBooking.listingTitle}
              listingAddress={selectedQRBooking.listingAddress}
              startTime={selectedQRBooking.startTime}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
