import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Warehouse,
  DollarSign
} from 'lucide-react';

export const BecomeHostPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedArea, setSelectedArea] = useState('Koramangala');
  const [spacesCount, setSpacesCount] = useState(1);
  const [parkingType, setParkingType] = useState('COVERED');

  const ratesPerArea: Record<string, number> = {
    Koramangala: 45,
    Indiranagar: 55,
    'HSR Layout': 40,
    'MG Road': 60,
    Whitefield: 35,
    'Electronic City': 30,
    Marathahalli: 35
  };

  const hourlyRate = ratesPerArea[selectedArea] || 40;
  // Estimated 8 hours/day, 24 days/month occupancy, 90% net after platform commission
  const monthlyEstimate = Math.round(hourlyRate * 8 * 24 * spacesCount * 0.9);

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Turn Idle Real Estate Into Predictable Monthly Cash</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Host your driveway or commercial bay on{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ParkShare
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Join hundreds of Bengaluru property owners monetizing empty parking bays. Set your own
            rules, hours, and rates with 100% automated weekly payouts.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/host/create"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 transition flex items-center gap-2"
            >
              <span>List Your Space Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#calculator"
              className="px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm transition"
            >
              Estimate My Earnings
            </a>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <div id="calculator" className="mb-16">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bengaluru Host Earnings Calculator
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time benchmark based on current neighborhood parking demand.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Inputs */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Neighborhood in Bengaluru
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {Object.keys(ratesPerArea).map((area) => (
                      <option key={area} value={area}>
                        {area} (Avg ₹{ratesPerArea[area]}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Number of Spaces
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSpacesCount(num)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                          spacesCount === num
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num} {num === 1 ? 'Bay' : 'Bays'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Parking Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['COVERED', 'BASEMENT', 'OPEN'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setParkingType(t)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          parkingType === t
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Earnings Result Card */}
              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl text-center shadow-lg">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                  Estimated Monthly Net Payout
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white mt-2 mb-1">
                  ₹{monthlyEstimate.toLocaleString('en-IN')}
                </div>
                <span className="text-xs text-emerald-300 font-semibold">
                  or ~₹{(monthlyEstimate * 12).toLocaleString('en-IN')}/year
                </span>

                <div className="mt-6 pt-5 border-t border-blue-700/60 text-xs text-blue-200 space-y-2 text-left">
                  <div className="flex justify-between">
                    <span>Base Hourly Rate</span>
                    <span className="font-bold text-white">₹{hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Commission</span>
                    <span className="font-bold text-white">10% only</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payout Frequency</span>
                    <span className="font-bold text-emerald-300">Every Monday to Bank</span>
                  </div>
                </div>

                <Link
                  to="/host/create"
                  className="mt-6 block w-full py-3.5 bg-white text-blue-950 hover:bg-blue-50 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md"
                >
                  Create Listing in 2 Minutes &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Step Host Onboarding Process */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-slate-900">How Hosting Works</h2>
            <p className="text-xs text-slate-500 mt-1">
              Zero upfront fees, complete control over your space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 font-black text-lg flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">List Your Bay</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add photos, select your location in Bengaluru, set your hourly rate, and mark
                available days & hours.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 font-black text-lg flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Drivers Book & Verify</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified drivers reserve spots. They present cryptographic QR access passes to your
                gatekeeper or security guard.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 font-black text-lg flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Weekly Payouts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Earnings are calculated server-side and wired directly to your bank account with
                complete transparency.
              </p>
            </div>
          </div>
        </div>

        {/* Host Protection Shield */}
        <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Host Protection Program</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              ₹10,000 Property Damage & Liability Cover
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 mt-2 leading-relaxed">
              Every booking is protected. We verify driver identities, track license plates with
              tamper-proof DynamoDB slot locks, and guarantee dispute resolution within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
