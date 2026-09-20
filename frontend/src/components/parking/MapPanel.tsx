import React, { useState } from 'react';
import { ParkingListing } from '../../types/parking';
import { Layers, Navigation, ZoomIn, ZoomOut, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MapPanelProps {
  listings: ParkingListing[];
  activeListingId?: string | null;
  onSelectListing?: (id: string | null) => void;
  className?: string;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  listings,
  activeListingId,
  onSelectListing,
  className = ''
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedListing, setSelectedListing] = useState<ParkingListing | null>(null);

  // Compute bounding box around Bengaluru coordinates
  // Bengaluru center ~ 12.9716° N, 77.5946° E
  // Lat range: 12.82 to 13.02 (0.2 deg)
  // Lng range: 77.55 to 77.76 (0.21 deg)
  const minLat = 12.83;
  const maxLat = 13.01;
  const minLng = 77.58;
  const maxLng = 77.75;

  const getCoordinatesPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 80 + 10;
    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y))
    };
  };

  const handlePinClick = (listing: ParkingListing) => {
    setSelectedListing(listing);
    onSelectListing?.(listing.listingId);
  };

  return (
    <div
      className={`relative w-full h-full min-h-[420px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner select-none ${className}`}
    >
      {/* Stylized Vector Map Grid Background */}
      <div
        className="absolute inset-0 opacity-40 transition-transform duration-300"
        style={{
          transform: `scale(${zoomLevel})`,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%),
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}
      />

      {/* Stylized Bengaluru Road Network Arteries */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30 stroke-slate-600"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ring Road Loop */}
        <path
          d="M 50 150 Q 200 40 380 180 T 320 380 Q 150 420 50 150"
          fill="none"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
        {/* Hosur Road / Koramangala Axis */}
        <line x1="220" y1="180" x2="310" y2="440" strokeWidth="4" className="stroke-blue-500/40" />
        {/* Old Airport / Whitefield Axis */}
        <line x1="220" y1="180" x2="450" y2="120" strokeWidth="4" className="stroke-indigo-500/40" />
        {/* Metro Lines */}
        <line x1="120" y1="190" x2="350" y2="180" strokeWidth="2" className="stroke-emerald-400/50" />
      </svg>

      {/* Bengaluru Area Labels */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-[22%] left-[28%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          MG Road CBD
        </span>
        <span className="absolute top-[32%] left-[45%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          Indiranagar
        </span>
        <span className="absolute top-[52%] left-[34%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          Koramangala
        </span>
        <span className="absolute top-[68%] left-[42%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          HSR Layout
        </span>
        <span className="absolute top-[28%] left-[78%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          Whitefield ITPL
        </span>
        <span className="absolute top-[82%] left-[45%] text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          Electronic City
        </span>
      </div>

      {/* Floating Interactive Spot Pins */}
      {listings.map((listing) => {
        const coords = getCoordinatesPercent(listing.latitude, listing.longitude);
        const isActive =
          activeListingId === listing.listingId || selectedListing?.listingId === listing.listingId;

        return (
          <div
            key={listing.listingId}
            onClick={() => handlePinClick(listing)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePinClick(listing); }}
            tabIndex={0}
            title={`₹${listing.pricePerHour}/hr • Rating ${listing.rating.toFixed(1)}`}
            aria-label={`Parking spot ${listing.title}, price ₹${listing.pricePerHour} per hour, rating ${listing.rating.toFixed(1)}`}
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              transform: `translate(-50%, -100%) scale(${isActive ? 1.15 : 1})`
            }}
            className={`absolute cursor-pointer transition-all duration-200 z-20 group`}
          >
            {/* Price Pill Pin */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 z-30'
                  : 'bg-white text-slate-900 hover:bg-blue-500 hover:text-white border border-slate-200'
              }`}
            >
              <span>₹{listing.pricePerHour}</span>
              <span className="text-[10px] font-normal opacity-80">/hr</span>
            </div>

            {/* Pin pointer triangle */}
            <div
              className={`w-2 h-2 mx-auto rotate-45 -mt-1 transition-colors ${
                isActive ? 'bg-blue-600' : 'bg-white group-hover:bg-blue-500'
              }`}
            />
          </div>
        );
      })}

      {/* Selected Listing Popup Card */}
      {selectedListing && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-slate-200 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex gap-3">
            <img
              src={selectedListing.photos[0]}
              alt={selectedListing.title}
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-semibold text-blue-600 uppercase">
                  {selectedListing.area}
                </span>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {selectedListing.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-800">
                  {selectedListing.rating.toFixed(1)}
                </span>
                <span className="text-slate-400">• ₹{selectedListing.pricePerHour}/hr</span>
              </div>
              <Link
                to={`/parking/${selectedListing.listingId}`}
                className="mt-2 block w-full py-1 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                View & Book
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Map Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden shadow-lg text-white">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-2 hover:bg-slate-800 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800" />
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
            className="p-2 hover:bg-slate-800 transition"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setZoomLevel(1);
            setSelectedListing(null);
          }}
          className="p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg text-white hover:bg-slate-800 transition shadow-lg"
          title="Center Bengaluru"
        >
          <Navigation className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-semibold">Bengaluru Metro Grid</span>
        <span className="text-slate-400">({listings.length} spots)</span>
      </div>
    </div>
  );
};
