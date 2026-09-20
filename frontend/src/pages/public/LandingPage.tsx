import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../../components/search/SearchBar';
import { ParkingCard } from '../../components/parking/ParkingCard';
import { parkingApi } from '../../api/parking';
import { ParkingListing } from '../../types/parking';
import {
  ShieldCheck,
  Zap,
  QrCode,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin
} from 'lucide-react';

const BENGALURU_HUBS = [
  {
    name: 'Koramangala',
    tag: 'Startups & Dining',
    spots: 18,
    avgPrice: 45,
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Indiranagar',
    tag: '100ft Road & Pubs',
    spots: 14,
    avgPrice: 55,
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'HSR Layout',
    tag: 'Tech Hub & Cafes',
    spots: 22,
    avgPrice: 40,
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'MG Road',
    tag: 'CBD & Metro Line',
    spots: 16,
    avgPrice: 60,
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Whitefield',
    tag: 'ITPL & Tech Parks',
    spots: 26,
    avgPrice: 35,
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Electronic City',
    tag: 'Infosys & Wipro Campuses',
    spots: 30,
    avgPrice: 30,
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=600&q=80'
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parkingApi.search({ limit: 4 }).then((res) => {
      setFeaturedListings(res.items.slice(0, 4));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        {/* Background Ambient Circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 text-blue-700 text-xs font-bold border border-blue-200 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Bengaluru's First Peer-to-Peer Parking Marketplace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Never circle for parking in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bengaluru
            </span>{' '}
            again.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Reserve secure, verified driveways, basement bays, and EV charging slots in advance.
            Cashless payment and instant QR verification.
          </p>

          {/* Search Widget */}
          <div className="mt-8 lg:mt-10">
            <SearchBar />
          </div>

          {/* Stats quick banner */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/60">
            <div>
              <p className="text-2xl font-black text-slate-900">45+</p>
              <p className="text-xs text-slate-500 font-medium">Bengaluru Hubs</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">99.8%</p>
              <p className="text-xs text-slate-500 font-medium">Booking Reliability</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">₹40/hr</p>
              <p className="text-xs text-slate-500 font-medium">Avg Hourly Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">₹18k</p>
              <p className="text-xs text-slate-500 font-medium">Host Monthly Earnings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Bengaluru Hubs */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Neighborhood Discovery
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Popular Bengaluru Parking Hubs
              </h2>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 sm:mt-0 flex items-center gap-1"
            >
              Browse all 45+ locations &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {BENGALURU_HUBS.map((hub) => (
              <div
                key={hub.name}
                onClick={() => navigate(`/search?area=${encodeURIComponent(hub.name)}`)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={hub.image}
                  alt={hub.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                    {hub.tag}
                  </span>
                  <h3 className="text-sm font-bold truncate mt-0.5">{hub.name}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                    <span>{hub.spots} spots</span>
                    <span className="font-semibold text-emerald-300">from ₹{hub.avgPrice}/hr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Spaces */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Top Rated Spots
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Featured Verified Spaces
              </h2>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 sm:mt-0 flex items-center gap-1"
            >
              See all available spots &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-72 animate-pulse border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredListings.map((listing) => (
                <ParkingCard key={listing.listingId} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why ParkKaro & How It Works */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Smart Parking Technology
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Why Drivers Choose ParkKaro
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed specifically to solve urban congestion in Indian metropolitan hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Zero Double-Booking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by DynamoDB transactional slot locks, your reserved bay is 100% guaranteed.
                No overbooking, no waiting, and no disputes upon arrival.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Instant QR Entry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No tickets, cash, or gate friction. Just flash your cryptographic ParkKaro QR code
                at the security boom barrier or gatekeeper for immediate access.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Bedrock AI Assistance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need EV charging near Indiranagar for 3 hours under ₹150? Ask our built-in Bedrock
                AI assistant in plain English for instant personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host Banner CTA */}
      <section className="py-16 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Monetize Unused Space
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
              Have an empty driveway or commercial bay?
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Earn ₹10,000 – ₹25,000/month by hosting your parking space to verified Bengaluru drivers.
              Set your own schedule, automated payouts, and comprehensive ₹10,000 property protection.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/become-host"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2"
              >
                <span>Calculate My Earnings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/search"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm text-center transition"
              >
                Learn How It Works
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero listing fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Weekly direct bank payout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified drivers only</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
