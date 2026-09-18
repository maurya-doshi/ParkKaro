import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { bookingsApi } from '../../api/bookings';
import { reviewsApi } from '../../api/reviews';
import { Booking, BookingStatus } from '../../types/booking';
import { QRDisplay } from '../../components/booking/QRDisplay';
import {
  Calendar,
  Clock,
  Car,
  QrCode,
  XCircle,
  Star,
  MessageSquare,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Plans changed');
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { showToast } = useToast();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list();
      setBookings(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      await bookingsApi.cancel(cancelModalBooking.bookingId, cancelReason);
      showToast('Booking cancelled and refund processed', 'success');
      setCancelModalBooking(null);
      loadBookings();
    } catch {
      showToast('Failed to cancel booking', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    try {
      await reviewsApi.create({
        listingId: reviewModalBooking.listingId,
        bookingId: reviewModalBooking.bookingId,
        rating: reviewRating,
        comment: reviewComment
      });
      showToast('Review published! Thank you for feedback.', 'success');
      setReviewModalBooking(null);
      setReviewComment('');
    } catch {
      showToast('Failed to post review', 'error');
    }
  };

  const filtered =
    statusFilter === 'ALL'
      ? bookings
      : bookings.filter((b) => b.bookingStatus === statusFilter);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <DashboardLayout
      type="driver"
      title="My Parking Reservations"
      subtitle="View access QR passes, check receipts, leave host reviews, and manage booking cancellations."
    >
      <div className="space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Bookings' : tab}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <p className="text-sm font-bold text-slate-900">No bookings in this category</p>
            <p className="text-xs text-slate-500 mt-1">
              Search nearby Bengaluru spots to reserve your space.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Find Parking
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b.bookingId}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusColor(
                        b.bookingStatus
                      )}`}
                    >
                      {b.bookingStatus}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {b.bookingId}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{b.listingTitle}</h3>
                  <p className="text-xs text-slate-500">{b.listingAddress}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {new Date(b.startTime).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {new Date(b.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        –{' '}
                        {new Date(b.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold uppercase tracking-wider font-mono">
                        {b.vehicleNumber}
                      </span>
                    </div>

                    <div className="font-black text-slate-900">₹{b.totalAmount}</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {(b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'ACTIVE') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setQrModalBooking(b)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Show QR Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {b.bookingStatus === 'COMPLETED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewModalBooking(b)}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Leave Review</span>
                      </button>
                      <Link
                        to={`/parking/${b.listingId}`}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        Book Again
                      </Link>
                    </>
                  )}

                  {b.bookingStatus === 'CANCELLED' && (
                    <span className="text-xs text-rose-500 font-medium">
                      Refunded ₹{b.refundAmount || b.totalAmount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Pass Modal */}
      {qrModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setQrModalBooking(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-lg text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <QRDisplay
              bookingId={qrModalBooking.bookingId}
              verificationCode={qrModalBooking.qrVerificationCode}
              listingTitle={qrModalBooking.listingTitle}
              listingAddress={qrModalBooking.listingAddress}
              startTime={qrModalBooking.startTime}
            />
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-rose-600">
                <AlertCircle className="w-4 h-4" />
                Cancel Reservation
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your reservation for{' '}
              <span className="font-bold text-slate-900">
                {cancelModalBooking.listingTitle}
              </span>
              ? Your slot will be released for other drivers.
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
              Full refund of ₹{cancelModalBooking.totalAmount} will be returned to your original payment method.
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none"
              >
                <option value="Plans changed">Plans changed / No longer needed</option>
                <option value="Found alternative parking">Found alternative parking</option>
                <option value="Vehicle issue">Vehicle mechanical trouble</option>
                <option value="Incorrect date/time selected">Selected wrong date or time</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Review Your Parking Experience
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              How was your parking experience at{' '}
              <span className="font-bold text-slate-800">
                {reviewModalBooking.listingTitle}
              </span>
              ?
            </p>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-slate-300 hover:scale-110 transition"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Your Feedback
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Was the spot easy to locate? How was the guard/host?"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Publish Review
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};
