import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortDropdownProps {
  value?: 'price' | 'rating' | 'distance';
  onChange: (sort: 'price' | 'rating' | 'distance') => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value = 'rating',
  onChange
}) => {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-slate-400 font-normal">Sort:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'price' | 'rating' | 'distance')}
        className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
      >
        <option value="rating">Top Rated</option>
        <option value="price">Lowest Price</option>
        <option value="distance">Nearest First</option>
      </select>
    </div>
  );
};
