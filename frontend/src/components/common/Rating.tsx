import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  reviewCount,
  showText = true,
  size = 'md'
}) => {
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold'
  };

  return (
    <div className="inline-flex items-center gap-1.5 font-medium text-slate-800">
      <Star className={`${starSizes[size]} fill-amber-400 text-amber-400 shrink-0`} />
      {showText && (
        <span className={textSizes[size]}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-slate-500 font-normal ml-1">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
};
