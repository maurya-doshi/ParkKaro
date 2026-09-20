import React from 'react';
import { ParkingListing } from '../../types/parking';
import { ShieldCheck, Info } from 'lucide-react';

interface BookingSummaryProps {
  listing: ParkingListing;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  listing,
  date,
  startTime,
  endTime,
  durationHours
}) => {
  const baseAmount = listing.pricePerHour * durationHours;
  const platformFee = Math.round(baseAmount * 0.1);
  const tax = 0;
  const totalAmount = baseAmount + platformFee + tax;

  const policyText = {
    FLEXIBLE: 'Free cancellation up to 1 hour before scheduled reservation start.',
    MODERATE: 'Full refund up to 24 hours before start time. 50% refund thereafter.',
    STRICT: '50% refund up to 48 hours before reservation start.'
  }[listing.cancellationPolicy || 'MODERATE'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
        Price Breakdown
      </h3>

      {/* Listing Mini Card */}
      <div className="flex gap-3 pb-3 border-b border-slate-100">
        <img
          src={listing.photos[0]}
          alt={listing.title}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{listing.title}</h4>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{listing.address}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-blue-600">
            <span>{listing.parkingType} Bay</span>
            <span>•</span>
            <span>₹{listing.pricePerHour}/hr</span>
          </div>
        </div>
      </div>

      {/* Reservation Times */}
      <div className="text-xs space-y-1.5 pb-3 border-b border-slate-100">
        <div className="flex justify-between text-slate-600">
          <span>Date</span>
          <span className="font-semibold text-slate-900">
            {new Date(date).toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Time Slot</span>
          <span className="font-semibold text-slate-900">
            {startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hr' : 'hrs'})
          </span>
        </div>
      </div>

      {/* Financial Line Items */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>
            Parking fee (₹{listing.pricePerHour} × {durationHours} {durationHours === 1 ? 'hr' : 'hrs'})
          </span>
          <span className="font-medium text-slate-900">₹{baseAmount}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <span>Platform service fee (10%)</span>
          </span>
          <span className="font-medium text-slate-900">₹{platformFee}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>GST / Taxes</span>
          <span className="font-medium text-emerald-600">₹0 (Waived)</span>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
          <span className="text-sm font-extrabold text-slate-900">Total Payable</span>
          <span className="text-xl font-black text-blue-600">₹{totalAmount}</span>
        </div>
      </div>

      {/* Cancellation policy note */}
      <div className="pt-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
              {listing.cancellationPolicy} Policy
            </span>
            <span>{policyText}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Double-booking guarantee covered by DynamoDB slot-lock</span>
      </div>
    </div>
  );
};
