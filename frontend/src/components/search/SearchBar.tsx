import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, Car, ChevronDown } from 'lucide-react';
import { VehicleType } from '../../types/parking';

interface SearchBarProps {
  initialArea?: string;
  initialDate?: string;
  initialVehicleType?: VehicleType | '';
  compact?: boolean;
  onSearch?: (filters: { area: string; date: string; vehicleType: string }) => void;
}

const POPULAR_AREAS = [
  'Koramangala',
  'Indiranagar',
  'HSR Layout',
  'MG Road',
  'Whitefield',
  'Electronic City',
  'Marathahalli'
];

export const SearchBar: React.FC<SearchBarProps> = ({
  initialArea = '',
  initialDate = new Date().toISOString().split('T')[0],
  initialVehicleType = '',
  compact = false,
  onSearch
}) => {
  const navigate = useNavigate();
  const [area, setArea] = useState(initialArea);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(initialVehicleType);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSearch) {
      onSearch({ area, date, vehicleType });
    } else {
      const params = new URLSearchParams();
      if (area) params.append('area', area);
      if (date) params.append('date', date);
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);
      if (vehicleType) params.append('vehicleType', vehicleType);

      navigate(`/search?${params.toString()}`);
    }
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-md border border-slate-200 w-full max-w-2xl"
      >
        <div className="relative flex-1 flex items-center pl-3">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mr-2" />
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onFocus={() => setShowAreaDropdown(true)}
            placeholder="Area in Bengaluru..."
            className="w-full text-sm font-medium bg-transparent focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="hidden sm:flex items-center px-2">
          <Calendar className="w-4 h-4 text-slate-400 mr-1.5" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs text-slate-600 bg-transparent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm shrink-0"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 ring-1 ring-slate-900/5">
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Location / Area */}
        <div className="relative flex flex-col p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition-colors">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Where in Bengaluru
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onFocus={() => setShowAreaDropdown(true)}
            placeholder="e.g. Koramangala, Indiranagar"
            className="w-full text-sm font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
          />

          {showAreaDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 block">
                Popular Bengaluru Hubs
              </span>
              <div className="grid grid-cols-1 gap-1">
                {POPULAR_AREAS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setArea(loc);
                      setShowAreaDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-between"
                  >
                    <span>{loc}</span>
                    <span className="text-[10px] text-slate-400">Bengaluru</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex flex-col p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition-colors">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
          />
        </div>

        {/* Time Slot */}
        <div className="flex flex-col p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition-colors">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Time Slot
          </label>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-900">
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="08:00">08:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="16:00">04:00 PM</option>
              <option value="18:00">06:00 PM</option>
            </select>
            <span className="text-slate-400 font-normal">to</span>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="12:00">12:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="16:00">04:00 PM</option>
              <option value="18:00">06:00 PM</option>
              <option value="20:00">08:00 PM</option>
              <option value="22:00">10:00 PM</option>
            </select>
          </div>
        </div>

        {/* Vehicle & Submit */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition-colors">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              Vehicle
            </label>
            <div className="relative">
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Any Vehicle</option>
                <option value="CAR">Car / Sedan</option>
                <option value="SUV">SUV / MUV</option>
                <option value="EV">EV Electric</option>
                <option value="BIKE">Two-Wheeler</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            className="h-full px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {/* Quick Pills */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0">Popular:</span>
        {POPULAR_AREAS.slice(0, 5).map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => {
              setArea(loc);
              if (onSearch) onSearch({ area: loc, date, vehicleType });
              else navigate(`/search?area=${loc}`);
            }}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium transition shrink-0"
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
};
