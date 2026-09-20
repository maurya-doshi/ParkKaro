import React from 'react';

interface PriceDisplayProps {
  pricePerHour: number;
  pricePerDay?: number;
  size?: 'sm' | 'md' | 'lg';
  period?: 'hr' | 'day' | 'both';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  pricePerHour,
  pricePerDay,
  size = 'md',
  period = 'both'
}) => {
  if (size === 'sm') {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold text-slate-900">₹{pricePerHour}</span>
        <span className="text-xs text-slate-500">/hr</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-blue-600">₹{pricePerHour}</span>
          <span className="text-sm font-medium text-slate-500">/ hour</span>
        </div>
        {pricePerDay && (
          <span className="text-xs text-slate-500 font-medium mt-0.5">
            or ₹{pricePerDay} / full day
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold text-slate-900">₹{pricePerHour}</span>
        <span className="text-xs text-slate-500 font-medium">/hr</span>
      </div>
      {period === 'both' && pricePerDay && (
        <span className="text-xs text-slate-400 font-normal">
          • ₹{pricePerDay}/day
        </span>
      )}
    </div>
  );
};
