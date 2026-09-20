import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap } from 'lucide-react';
import { ParkingListing } from '../../types/parking';
import { Rating } from '../common/Rating';
import { PriceDisplay } from '../common/PriceDisplay';
import { FavoriteButton } from '../common/FavoriteButton';
import { AmenityList } from './AmenityList';

interface ParkingCardProps {
  listing: ParkingListing;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  listing,
  highlighted = false,
  onMouseEnter,
  onMouseLeave
}) => {
  const hasEv = listing.amenities.some(
    (a) => a.toLowerCase() === 'evcharging' || a.toLowerCase() === 'ev'
  );

  const photo =
    listing.photos && listing.photos.length > 0
      ? listing.photos[0]
      : 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${
        highlighted
          ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20 translate-y-[-2px]'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton listingId={listing.listingId} size="md" />
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/85 text-white backdrop-blur-md shadow-sm">
            {listing.parkingType}
          </span>
          {hasEv && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 text-white backdrop-blur-md shadow-sm">
              <Zap className="w-3 h-3 fill-emerald-200 text-emerald-200" />
              EV Fast Bay
            </span>
          )}
        </div>

        {/* Distance Pill */}
        {listing.distance !== undefined && (
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>{listing.distance.toFixed(1)} km away</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <Link
        to={`/parking/${listing.listingId}`}
        className="flex flex-col flex-grow p-4 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <Rating rating={listing.rating} reviewCount={listing.reviewCount} size="sm" />
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {listing.area}, {listing.city}
          </span>
        </p>

        {/* Amenities preview */}
        <div className="mb-4">
          <AmenityList amenities={listing.amenities} maxDisplay={3} size="sm" />
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <PriceDisplay
            pricePerHour={listing.pricePerHour}
            pricePerDay={listing.pricePerDay}
            size="md"
          />
          <span className="inline-flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
            Book Spot &rarr;
          </span>
        </div>
      </Link>
    </div>
  );
};
