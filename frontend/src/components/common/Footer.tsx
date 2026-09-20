import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                P
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Park<span className="text-blue-500">Share</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier marketplace for verified driveways, garages, and commercial parking spaces.
              Safe, cashless, and instant QR verification across Bengaluru.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl w-fit">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>₹10,000 Host Protection Guarantee</span>
            </div>
          </div>

          {/* Bengaluru Locations */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Bengaluru Hotspots
            </h4>
            <ul className="space-y-2 text-xs">
              {['Koramangala', 'Indiranagar', 'HSR Layout', 'MG Road & CBD', 'Whitefield ITPL', 'Electronic City'].map(
                (loc) => (
                  <li key={loc}>
                    <Link
                      to={`/search?area=${encodeURIComponent(loc.split(' ')[0])}`}
                      className="hover:text-blue-400 transition flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3 text-slate-600" />
                      <span>{loc}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Drivers & Hosts */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/search" className="hover:text-white transition">
                  Search Spaces
                </Link>
              </li>
              <li>
                <Link to="/become-host" className="hover:text-white transition">
                  Host Your Driveway
                </Link>
              </li>
              <li>
                <Link to="/driver/dashboard" className="hover:text-white transition">
                  Driver Hub & Bookings
                </Link>
              </li>
              <li>
                <Link to="/host/dashboard" className="hover:text-white transition">
                  Host Dashboard & Payouts
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition">
                  Platform Moderation
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Trust */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Powered by
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AWS Bedrock AI Assistant</span>
              </li>
              <li>Amazon DynamoDB Slot Lock</li>
              <li>Amazon Cognito Auth Verification</li>
              <li>Instant QR Code Access Protocol</li>
            </ul>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              Demo Mode Active • Bengaluru Hackathon Build
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ParkKaro Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>by Person 1 (Frontend)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
