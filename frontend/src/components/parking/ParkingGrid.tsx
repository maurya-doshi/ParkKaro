import React from 'react';
import { ParkingListing } from '../../types/parking';
import { ParkingCard } from './ParkingCard';
import { Search, RotateCcw } from 'lucide-react';

interface ParkingGridProps {
  listings: ParkingListing[];
  loading?: boolean;
  activeListingId?: string | null;
  onHoverListing?: (id: string | null) => void;
  onResetFilters?: () => void;
}

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  listings,
  loading = false,
  activeListingId,
  onHoverListing,
  onResetFilters
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse flex flex-col"
          >
            <div className="aspect-[16/10] bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 bg-slate-100 rounded w-16" />
                <div className="h-5 bg-slate-100 rounded w-20" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-4 bg-slate-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No parking spots found</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          We couldn't find any parking listings matching your exact criteria. Try adjusting your
          dates, budget, or area filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {listings.map((listing) => (
        <ParkingCard
          key={listing.listingId}
          listing={listing}
          highlighted={activeListingId === listing.listingId}
          onMouseEnter={() => onHoverListing?.(listing.listingId)}
          onMouseLeave={() => onHoverListing?.(null)}
        />
      ))}
    </div>
  );
};
