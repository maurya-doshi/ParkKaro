import React from 'react';
import { ParkingType, VehicleType } from '../../types/parking';
import { RotateCcw, ShieldCheck, Video, Zap, Warehouse, Star } from 'lucide-react';

export interface FilterState {
  parkingType?: ParkingType | '';
  vehicleType?: VehicleType | '';
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  className = ''
}) => {
  const PARKING_TYPES: { value: ParkingType; label: string }[] = [
    { value: 'COVERED', label: 'Covered / Roof' },
    { value: 'BASEMENT', label: 'Basement Bay' },
    { value: 'GARAGE', label: 'Private Garage' },
    { value: 'OPEN', label: 'Open Paved Lot' },
    { value: 'COMMERCIAL', label: 'Commercial Complex' }
  ];

  const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
    { value: 'CAR', label: 'Car / Sedan' },
    { value: 'SUV', label: 'SUV / MUV' },
    { value: 'EV', label: 'Electric Vehicle (EV)' },
    { value: 'BIKE', label: 'Motorbike / Scooter' }
  ];

  const AMENITY_OPTIONS = [
    { id: 'cctv', label: 'CCTV Surveillance', icon: Video },
    { id: 'security', label: '24/7 Security Guard', icon: ShieldCheck },
    { id: 'evCharging', label: 'EV Charger Ready', icon: Zap },
    { id: 'covered', label: 'Sheltered / Roof', icon: Warehouse }
  ];

  const toggleAmenity = (id: string) => {
    const next = filters.amenities.includes(id)
      ? filters.amenities.filter((a) => a !== id)
      : [...filters.amenities, id];
    onChange({ ...filters, amenities: next });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm">Filter Search</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Hourly Price Range */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Hourly Rate (₹)
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 block font-medium">Min</span>
            <input
              type="number"
              min={20}
              max={150}
              value={filters.minPrice || 20}
              onChange={(e) =>
                onChange({ ...filters, minPrice: Number(e.target.value) || undefined })
              }
              className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">-</span>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 block font-medium">Max</span>
            <input
              type="number"
              min={30}
              max={250}
              value={filters.maxPrice || 100}
              onChange={(e) =>
                onChange({ ...filters, maxPrice: Number(e.target.value) || undefined })
              }
              className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Parking Type */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Parking Type
        </label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition">
            <input
              type="radio"
              name="parkingType"
              checked={!filters.parkingType}
              onChange={() => onChange({ ...filters, parkingType: '' })}
              className="accent-blue-600"
            />
            <span>All Types</span>
          </label>
          {PARKING_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition"
            >
              <input
                type="radio"
                name="parkingType"
                checked={filters.parkingType === type.value}
                onChange={() => onChange({ ...filters, parkingType: type.value })}
                className="accent-blue-600"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Vehicle Support
        </label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition">
            <input
              type="radio"
              name="vehicleType"
              checked={!filters.vehicleType}
              onChange={() => onChange({ ...filters, vehicleType: '' })}
              className="accent-blue-600"
            />
            <span>Any Vehicle</span>
          </label>
          {VEHICLE_TYPES.map((v) => (
            <label
              key={v.value}
              className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-600 transition"
            >
              <input
                type="radio"
                name="vehicleType"
                checked={filters.vehicleType === v.value}
                onChange={() => onChange({ ...filters, vehicleType: v.value })}
                className="accent-blue-600"
              />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Security & Amenities
        </label>
        <div className="space-y-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const isChecked = filters.amenities.includes(amenity.id);
            const Icon = amenity.icon;
            return (
              <label
                key={amenity.id}
                className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 rounded-sm accent-blue-600"
                />
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{amenity.label}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Minimum Rating
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Any', value: undefined },
            { label: '4.0★+', value: 4.0 },
            { label: '4.7★+', value: 4.7 }
          ].map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => onChange({ ...filters, rating: r.value })}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                filters.rating === r.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r.value && <Star className="w-3 h-3 fill-current" />}
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
