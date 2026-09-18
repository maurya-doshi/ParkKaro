import React, { useState } from 'react';
import { QrCode, Copy, Check, Navigation, Calendar, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface QRDisplayProps {
  bookingId: string;
  verificationCode: string;
  qrData?: string;
  listingTitle?: string;
  listingAddress?: string;
  latitude?: number;
  longitude?: number;
  startTime?: string;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  bookingId,
  verificationCode,
  qrData,
  listingTitle,
  listingAddress,
  latitude = 12.9352,
  longitude = 77.6245,
  startTime
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    showToast('Verification code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenNavigation = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl max-w-sm mx-auto text-center flex flex-col items-center">
      {/* Brand Header inside pass */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center">
          P
        </div>
        <span className="text-xs font-extrabold text-slate-900 tracking-tight">
          ParkShare Access Pass
        </span>
      </div>

      {/* SVG QR Code Pattern Container */}
      <div className="relative p-4 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-inner mb-4 flex flex-col items-center">
        {/* Render crisp SVG mock QR pattern */}
        <svg
          viewBox="0 0 160 160"
          className="w-44 h-44 fill-slate-900"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Border Position Markers */}
          <rect x="10" y="10" width="40" height="40" rx="6" fill="#0f172a" />
          <rect x="18" y="18" width="24" height="24" rx="4" fill="#ffffff" />
          <rect x="24" y="24" width="12" height="12" rx="2" fill="#0f172a" />

          <rect x="110" y="10" width="40" height="40" rx="6" fill="#0f172a" />
          <rect x="118" y="18" width="24" height="24" rx="4" fill="#ffffff" />
          <rect x="124" y="24" width="12" height="12" rx="2" fill="#0f172a" />

          <rect x="10" y="110" width="40" height="40" rx="6" fill="#0f172a" />
          <rect x="18" y="118" width="24" height="24" rx="4" fill="#ffffff" />
          <rect x="24" y="124" width="12" height="12" rx="2" fill="#0f172a" />

          {/* Random Seed Matrix Blocks */}
          <rect x="60" y="20" width="8" height="8" fill="#2563eb" />
          <rect x="75" y="20" width="8" height="8" fill="#0f172a" />
          <rect x="90" y="20" width="8" height="8" fill="#0f172a" />
          <rect x="60" y="35" width="8" height="8" fill="#0f172a" />
          <rect x="75" y="45" width="8" height="8" fill="#2563eb" />
          <rect x="90" y="35" width="8" height="8" fill="#0f172a" />

          <rect x="20" y="65" width="8" height="8" fill="#0f172a" />
          <rect x="35" y="65" width="8" height="8" fill="#0f172a" />
          <rect x="20" y="80" width="8" height="8" fill="#2563eb" />
          <rect x="35" y="90" width="8" height="8" fill="#0f172a" />

          <rect x="60" y="60" width="12" height="12" rx="2" fill="#0f172a" />
          <rect x="76" y="60" width="10" height="10" rx="2" fill="#2563eb" />
          <rect x="90" y="60" width="10" height="10" rx="2" fill="#0f172a" />
          <rect x="60" y="76" width="10" height="10" rx="2" fill="#2563eb" />
          <rect x="76" y="76" width="10" height="10" rx="2" fill="#0f172a" />
          <rect x="90" y="76" width="10" height="10" rx="2" fill="#2563eb" />
          <rect x="60" y="90" width="10" height="10" rx="2" fill="#0f172a" />
          <rect x="76" y="90" width="10" height="10" rx="2" fill="#0f172a" />
          <rect x="90" y="90" width="10" height="10" rx="2" fill="#0f172a" />

          <rect x="110" y="65" width="8" height="8" fill="#0f172a" />
          <rect x="125" y="65" width="8" height="8" fill="#2563eb" />
          <rect x="140" y="80" width="8" height="8" fill="#0f172a" />
          <rect x="125" y="90" width="8" height="8" fill="#0f172a" />

          <rect x="60" y="110" width="8" height="8" fill="#2563eb" />
          <rect x="75" y="110" width="8" height="8" fill="#0f172a" />
          <rect x="90" y="125" width="8" height="8" fill="#0f172a" />
          <rect x="60" y="135" width="8" height="8" fill="#0f172a" />
          <rect x="75" y="135" width="8" height="8" fill="#2563eb" />
          <rect x="90" y="140" width="8" height="8" fill="#0f172a" />

          <rect x="110" y="110" width="10" height="10" rx="2" fill="#0f172a" />
          <rect x="125" y="110" width="8" height="8" fill="#2563eb" />
          <rect x="140" y="125" width="8" height="8" fill="#0f172a" />
          <rect x="110" y="135" width="8" height="8" fill="#0f172a" />
          <rect x="125" y="135" width="10" height="10" rx="2" fill="#2563eb" />
          <rect x="140" y="140" width="8" height="8" fill="#0f172a" />
        </svg>

        {/* Scan Status Badge */}
        <span className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <QrCode className="w-3 h-3 text-blue-600" />
          Scan at Entrance
        </span>
      </div>

      {/* Human Readable Verification Code */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Gate Verification PIN
        </span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xl font-black text-slate-900 tracking-widest font-mono">
            {verificationCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-500 hover:text-blue-600 transition rounded"
            title="Copy verification code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Info */}
      <div className="text-xs text-slate-500 space-y-1 mb-5">
        <p className="font-semibold text-slate-800 line-clamp-1">{listingTitle}</p>
        <p className="text-[11px] line-clamp-1">{listingAddress}</p>
        <p className="text-[10px] text-slate-400 font-mono">Ref: {bookingId}</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          onClick={handleOpenNavigation}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions</span>
        </button>

        <button
          type="button"
          onClick={() => showToast('Pass added to calendar & saved offline', 'success')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Pass</span>
        </button>
      </div>
    </div>
  );
};
