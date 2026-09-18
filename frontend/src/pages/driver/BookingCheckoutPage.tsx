import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { parkingApi } from '../../api/parking';
import { bookingsApi } from '../../api/bookings';
import { vehiclesApi } from '../../api/vehicles';
import { ParkingListing } from '../../types/parking';
import { Vehicle } from '../../types/vehicle';
import { VehicleSelector } from '../../components/booking/VehicleSelector';
import { BookingSummary } from '../../components/booking/BookingSummary';
import { ChevronLeft, ShieldCheck, Lock, CreditCard, Smartphone, Building, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

export const BookingCheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const startTime = searchParams.get('startTime') || '10:00';
  const endTime = searchParams.get('endTime') || '14:00';

  const [listing, setListing] = useState<ParkingListing | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('arjun@okhdfcbank');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    parkingApi
      .getById(id)
      .then((data) => setListing(data))
      .catch((e) => {
        console.error(e);
        showToast('Listing not found', 'error');
        navigate('/search');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const durationHours = Math.max(1, endHour - startHour);

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    if (!selectedVehicle) {
      showToast('Please select a vehicle for this reservation', 'error');
      return;
    }

    setProcessing(true);

    try {
      const booking = await bookingsApi.create({
        listingId: listing.listingId,
        vehicleId: selectedVehicle.vehicleId,
        date,
        startTime,
        endTime
      });

      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('Booking confirmed! Slot guaranteed.', 'success');
      navigate(`/confirmation/${booking.bookingId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete booking', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto" />
          <div className="h-64 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to={`/parking/${listing.listingId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to parking spot details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Confirm & Reserve Space
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Slot will be locked under your vehicle number via DynamoDB double-booking prevention.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Checkout Steps Form */}
          <form onSubmit={handlePayAndConfirm} className="lg:col-span-7 space-y-6">
            {/* Step 1: Vehicle Selection */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900">Vehicle Assignment</h2>
              </div>

              <VehicleSelector
                selectedVehicleId={selectedVehicle?.vehicleId || ''}
                onSelect={setSelectedVehicle}
                allowedVehicleTypes={listing.vehicleTypes}
              />
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900">Payment Simulation (Demo Gateway)</h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'Instant UPI', icon: Smartphone },
                  { id: 'CARD', label: 'Credit / Debit', icon: CreditCard },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: Building }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        paymentMethod === m.id
                          ? 'bg-blue-50/70 border-blue-600 text-blue-700 ring-2 ring-blue-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'UPI' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="flex-1 px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      required
                    />
                    <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Supported apps: Google Pay, PhonePe, Paytm, BHIM
                  </span>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      defaultValue="4532 •••• •••• 8910"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      disabled
                    />
                    <input
                      type="password"
                      defaultValue="•••"
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      disabled
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'NET_BANKING' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <select className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit encrypted test transaction • No actual charge in demo mode</span>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="submit"
              disabled={processing || !selectedVehicle}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {processing ? (
                <span>Securing Slot in DynamoDB...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm & Generate QR Pass</span>
                </>
              )}
            </button>
          </form>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-5 sticky top-24">
            <BookingSummary
              listing={listing}
              date={date}
              startTime={startTime}
              endTime={endTime}
              durationHours={durationHours}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
