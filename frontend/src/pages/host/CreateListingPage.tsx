import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { parkingApi } from '../../api/parking';
import { aiApi } from '../../api/ai';
import { ParkingType, VehicleType, CancellationPolicy } from '../../types/parking';
import {
  MapPin,
  Warehouse,
  Car,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('Koramangala');
  const [address, setAddress] = useState('');
  const [parkingType, setParkingType] = useState<ParkingType>('COVERED');
  const [capacity, setCapacity] = useState(2);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(['CAR', 'SUV']);
  const [pricePerHour, setPricePerHour] = useState(45);
  const [pricePerDay, setPricePerDay] = useState(380);
  const [amenities, setAmenities] = useState<string[]>(['covered', 'cctv', 'security', 'lighting']);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('MODERATE');
  const [aiPricingInsight, setAiPricingInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const BENGALURU_AREAS = [
    'Koramangala',
    'Indiranagar',
    'HSR Layout',
    'MG Road',
    'Whitefield',
    'Electronic City',
    'Marathahalli'
  ];

  const handleFetchAiPricing = async () => {
    setLoadingAi(true);
    try {
      const res = await aiApi.getPricingSuggestion('temp_id', area);
      setPricePerHour(res.suggestedHourlyPrice);
      setPricePerDay(res.suggestedDailyPrice);
      setAiPricingInsight(res.insight);
      showToast('AI Pricing Recommendation applied!', 'success');
    } catch {
      showToast('Could not fetch AI pricing', 'error');
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleVehicle = (v: VehicleType) => {
    setVehicleTypes((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim()) {
      showToast('Please fill in title and address', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newListing = await parkingApi.create({
        title: title.trim(),
        description: description.trim(),
        area,
        address: address.trim(),
        city: 'Bengaluru',
        latitude: 12.9352,
        longitude: 77.6245,
        parkingType,
        capacity,
        vehicleTypes,
        pricePerHour,
        pricePerDay,
        amenities,
        cancellationPolicy,
        photos: [
          'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
        ]
      });

      showToast('Listing published successfully! It is now live.', 'success');
      navigate('/host/listings');
    } catch {
      showToast('Failed to create listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      type="host"
      title="Create New Parking Listing"
      subtitle="Publish a new parking space or driveway to start welcoming verified Bengaluru drivers."
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition ${
                  step === s
                    ? 'bg-blue-600 text-white shadow-md'
                    : step > s
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-500">
            Step {step} of 4:{' '}
            {step === 1 ? 'Location' : step === 2 ? 'Capacity' : step === 3 ? 'Pricing' : 'Rules'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Location & Description */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Listing Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Covered Parking Near 100ft Road"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Bengaluru Area / Neighborhood *
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {BENGALURU_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Parking Type
                  </label>
                  <select
                    value={parkingType}
                    onChange={(e) => setParkingType(e.target.value as ParkingType)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="COVERED">Covered / Roof Bay</option>
                    <option value="BASEMENT">Basement Lot</option>
                    <option value="GARAGE">Private Lockable Garage</option>
                    <option value="OPEN">Open Paved Lot</option>
                    <option value="COMMERCIAL">Commercial Complex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 124, 4th Cross, 5th Block, Near Forum Mall"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe access instructions, landmark reference, gate security details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Capacity & Vehicle Types */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Total Simultaneous Parking Capacity (Bays)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 1)}
                  className="w-32 px-4 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Each space is individually tracked for double-booking prevention.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Supported Vehicle Types
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['CAR', 'SUV', 'EV', 'BIKE'] as VehicleType[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleVehicle(v)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                        vehicleTypes.includes(v)
                          ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span>{v}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Available Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'covered', label: 'Covered / Roof' },
                    { id: 'cctv', label: 'CCTV Camera' },
                    { id: 'security', label: '24/7 Guard' },
                    { id: 'lighting', label: 'Well Lit' },
                    { id: 'evCharging', label: 'EV Charger' },
                    { id: 'accessible', label: 'Wheelchair Ramp' }
                  ].map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={amenities.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Bedrock AI Assistant */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              {/* Bedrock AI Callout Card */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">
                      Bedrock AI Smart Pricing Assistant
                    </h4>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Analyze real-time demand in {area} to maximize monthly occupancy and earnings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFetchAiPricing}
                  disabled={loadingAi}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
                >
                  {loadingAi ? 'Analyzing...' : 'Get AI Pricing'}
                </button>
              </div>

              {aiPricingInsight && (
                <div className="p-3 bg-white border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed font-medium">
                  {aiPricingInsight}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Price Per Hour (₹) *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value) || 30)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Price Per Full Day (₹)
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      min={100}
                      max={2000}
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(Number(e.target.value) || 200)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                <span>Platform commission is 10%. On a ₹{pricePerHour}/hr booking, you take home </span>
                <span className="font-bold text-emerald-600">
                  ₹{Math.round(pricePerHour * 0.9)}/hr
                </span>
                .
              </div>
            </div>
          )}

          {/* STEP 4: Cancellation Policy & Review */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Cancellation Policy
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'FLEXIBLE',
                      title: 'Flexible',
                      desc: 'Drivers get 100% refund if cancelled 1 hour before scheduled time.'
                    },
                    {
                      id: 'MODERATE',
                      title: 'Moderate (Recommended)',
                      desc: 'Drivers get 100% refund up to 24 hours prior; 50% refund thereafter.'
                    },
                    {
                      id: 'STRICT',
                      title: 'Strict',
                      desc: '50% refund up to 48 hours prior. No refund within 48 hours.'
                    }
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`block p-3.5 rounded-2xl border cursor-pointer transition ${
                        cancellationPolicy === p.id
                          ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.title}</span>
                        <input
                          type="radio"
                          name="policy"
                          checked={cancellationPolicy === p.id}
                          onChange={() => setCancellationPolicy(p.id as CancellationPolicy)}
                          className="accent-blue-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{p.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Listing Summary Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-900 block mb-1 text-sm">{title || 'Untitled Space'}</span>
                <p className="text-slate-500">{address}, {area}, Bengaluru</p>
                <p className="text-blue-600 font-bold">
                  ₹{pricePerHour}/hr • {capacity} spaces • {parkingType}
                </p>
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Publish Listing Now'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
