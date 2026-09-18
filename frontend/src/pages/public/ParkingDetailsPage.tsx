import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parkingApi } from '../../api/parking';
import { reviewsApi } from '../../api/reviews';
import { ParkingListing, AvailabilityCheckResponse } from '../../types/parking';
import { Review } from '../../types/review';
import { Rating } from '../../components/common/Rating';
import { FavoriteButton } from '../../components/common/FavoriteButton';
import { AmenityList } from '../../components/parking/AmenityList';
import {
  MapPin,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  Car,
  ChevronLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ParkingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ParkingListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Reservation Form State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [availability, setAvailability] = useState<AvailabilityCheckResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([parkingApi.getById(id), reviewsApi.getByListing(id)])
      .then(([listingData, reviewList]) => {
        setListing(listingData);
        setReviews(reviewList);
      })
      .catch((err) => {
        console.error(err);
        showToast('Parking space not found', 'error');
        navigate('/search');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Check availability when date or times change
  useEffect(() => {
    if (!id || !listing) return;
    setCheckingAvailability(true);
    parkingApi
      .checkAvailability(id, selectedDate, startTime, endTime)
      .then((res) => setAvailability(res))
      .catch((e) => console.error(e))
      .finally(() => setCheckingAvailability(false));
  }, [id, selectedDate, startTime, endTime, listing]);

  if (loading || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-[16/9] bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const durationHours = Math.max(1, endHour - startHour);
  const baseAmount = listing.pricePerHour * durationHours;
  const platformFee = Math.round(baseAmount * 0.1);
  const totalAmount = baseAmount + platformFee;

  const handleProceedToCheckout = () => {
    const params = new URLSearchParams({
      date: selectedDate,
      startTime,
      endTime
    });
    navigate(`/checkout/${listing.listingId}?${params.toString()}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link & Quick Actions */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to search results
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!', 'success');
              }}
              className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-600 transition"
              title="Share space"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <FavoriteButton listingId={listing.listingId} size="md" />
          </div>
        </div>

        {/* Title & Location Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {listing.parkingType} BAY
            </span>
            {listing.amenities.includes('evCharging') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <Zap className="w-3 h-3" />
                EV Fast Charger
              </span>
            )}
            <Rating rating={listing.rating} reviewCount={listing.reviewCount} size="md" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {listing.title}
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {listing.address}, {listing.area}, {listing.city}
            </span>
          </p>
        </div>

        {/* Photo Gallery Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-10 rounded-3xl overflow-hidden shadow-sm">
          <div className="md:col-span-8 aspect-[16/10] overflow-hidden bg-slate-100">
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover hover:scale-102 transition duration-500"
            />
          </div>
          <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3">
            <div className="aspect-[16/10] overflow-hidden bg-slate-100 rounded-r-2xl">
              <img
                src={
                  listing.photos[1] ||
                  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
                }
                alt="Parking Bay"
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
            </div>
            <div className="aspect-[16/10] overflow-hidden bg-slate-100 rounded-r-2xl">
              <img
                src={
                  listing.photos[2] ||
                  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
                }
                alt="Entry View"
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid with Sticky Booking Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Details Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Host Banner */}
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt="Host"
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>Hosted by Priya Sharma</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified Host • Responds within 10 mins • 4.9★ (38 reviews)
                  </p>
                </div>
              </div>

              <Link
                to="/driver/messages"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Host</span>
              </Link>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3">About This Parking Space</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>

              {/* Supported Vehicles */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Compatible Vehicles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {listing.vehicleTypes.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities & Security Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">Amenities & Security</h2>
              <div className="mb-4">
                <AmenityList amenities={listing.amenities} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All listed amenities are physically verified by our Bengaluru operations team.
                The security guard on premise is equipped with a digital scanner for seamless QR access.
              </p>
            </div>

            {/* Availability Slot Matrix */}
            {availability && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Hourly Space Availability
                    </h2>
                    <p className="text-xs text-slate-500">
                      Total bay capacity: {availability.capacity} spaces
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {availability.requestedRange.isAvailable ? 'Selected Slot Available' : 'Busy'}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {availability.slots.slice(0, 16).map((slot) => {
                    const isWithinRange =
                      parseInt(slot.time.split(':')[0]) >= startHour &&
                      parseInt(slot.time.split(':')[0]) < endHour;

                    return (
                      <div
                        key={slot.time}
                        className={`p-2 rounded-xl text-center border transition ${
                          isWithinRange
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : slot.available > 0
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-rose-50 border-rose-200 text-rose-500 opacity-60'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{slot.time}</span>
                        <span
                          className={`text-[9px] block ${
                            isWithinRange ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {slot.available} free
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Driver Reviews</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Rating rating={listing.rating} reviewCount={reviews.length} size="md" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev.reviewId} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            rev.userAvatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                          }
                          alt={rev.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-900">{rev.userName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <Rating rating={rev.rating} showText={false} size="sm" />
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Reservation Box (Desktop Right Sidebar) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl space-y-5">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">₹{listing.pricePerHour}</span>
                  <span className="text-xs font-semibold text-slate-500">/ hour</span>
                </div>
                {listing.pricePerDay && (
                  <span className="text-xs font-semibold text-slate-400">
                    ₹{listing.pricePerDay}/day
                  </span>
                )}
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Select Date
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Start Time
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="08:00">08:00 AM</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="18:00">06:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      End Time
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="18:00">06:00 PM</option>
                        <option value="20:00">08:00 PM</option>
                        <option value="22:00">10:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{listing.pricePerHour} × {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                  </span>
                  <span className="font-semibold text-slate-900">₹{baseAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform fee (10%)</span>
                  <span className="font-semibold text-slate-900">₹{platformFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-blue-600">₹{totalAmount}</span>
                </div>
              </div>

              {/* Reserve Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={Boolean(checkingAvailability || (availability && !availability.requestedRange.isAvailable))}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 cursor-pointer"
              >
                {checkingAvailability
                  ? 'Checking availability...'
                  : availability && !availability.requestedRange.isAvailable
                  ? 'Slot Unavailable'
                  : 'Reserve Space Now'}
              </button>

              <div className="text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Instant QR verification issued immediately after checkout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
