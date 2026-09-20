import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { Booking } from '../../types/booking';
import { QRDisplay } from '../../components/booking/QRDisplay';
import { CheckCircle2, ArrowRight, ShieldCheck, MapPin, Car, Clock } from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    bookingsApi
      .getById(bookingId)
      .then((b) => setBooking(b))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading || !booking) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto" />
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            Reservation Guaranteed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            You're All Set to Park!
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
            Your space at{' '}
            <span className="font-semibold text-slate-800">{booking.listingTitle}</span> has been
            reserved and verified.
          </p>
        </div>

        {/* QR Access Pass Card */}
  <div className="mb-8">
    <QRDisplay
      bookingId={booking.bookingId}
      verificationCode={booking.qrVerificationCode}
      qrData={booking.qrData}
      listingTitle={booking.listingTitle}
      listingAddress={booking.listingAddress}
      startTime={booking.startTime}
    />
    {/* Add to Calendar button */}
    <button
      type="button"
      onClick={() => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${formatDate(start)}\nDTEND:${formatDate(end)}\nSUMMARY:Parking Reservation at ${booking.listingTitle}\nDESCRIPTION:Location - ${booking.listingAddress}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parking-${booking.bookingId}.ics`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl shadow-sm transition"
    >
      Add to Calendar
    </button>
  </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reservation Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Time Window
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {new Date(booking.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}{' '}
                  –{' '}
                  {new Date(booking.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(booking.startTime).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Car className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Authorized Vehicle
                </span>
                <p className="font-black text-slate-900 mt-0.5 tracking-wider uppercase">
                  {booking.vehicleNumber}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{booking.vehicleModel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Location
                </span>
                <p className="font-bold text-slate-900 mt-0.5 line-clamp-1">
                  {booking.listingAddress}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{booking.listingArea}, Bengaluru</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Payment Status
                </span>
                <p className="font-bold text-emerald-600 mt-0.5">
                  Paid ₹{booking.totalAmount} (Demo UPI)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">ID: {booking.bookingId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/driver/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Go to Driver Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/driver/bookings"
            className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition text-center"
          >
            View All My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};
