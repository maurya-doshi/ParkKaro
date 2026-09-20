import React from 'react';
import {
  ShieldCheck,
  Video,
  Sun,
  Zap,
  Clock,
  Accessibility,
  Warehouse,
  Check
} from 'lucide-react';

interface AmenityListProps {
  amenities: string[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
}

const AMENITY_MAP: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  covered: { label: 'Covered / Roof', icon: Warehouse },
  cctv: { label: 'CCTV Monitored', icon: Video },
  security: { label: '24/7 Security Guard', icon: ShieldCheck },
  lighting: { label: 'Well Lit / Floodlights', icon: Sun },
  evcharging: { label: 'EV Charging Bay', icon: Zap },
  evCharging: { label: 'EV Charging Bay', icon: Zap },
  '24x7': { label: '24/7 Access', icon: Clock },
  accessible: { label: 'Wheelchair Accessible', icon: Accessibility }
};

export const AmenityList: React.FC<AmenityListProps> = ({
  amenities,
  maxDisplay,
  size = 'md'
}) => {
  const displayed = maxDisplay ? amenities.slice(0, maxDisplay) : amenities;
  const remaining = maxDisplay ? amenities.length - maxDisplay : 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayed.map((key) => {
        const item = AMENITY_MAP[key] || AMENITY_MAP[key.toLowerCase()] || {
          label: key,
          icon: Check
        };
        const IconComponent = item.icon;

        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-md font-medium text-slate-700 bg-slate-100/90 border border-slate-200/70 ${
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
            }`}
          >
            <IconComponent className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{item.label}</span>
          </span>
        );
      })}

      {remaining > 0 && (
        <span className="text-xs text-slate-400 font-medium px-1.5 py-0.5 bg-slate-50 rounded-md border border-slate-200/50">
          +{remaining} more
        </span>
      )}
    </div>
  );
};
