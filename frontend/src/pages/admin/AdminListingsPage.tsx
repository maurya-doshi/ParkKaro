import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ParkingListing } from '../../types/parking';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Search,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-rose-50 text-rose-700'
};

export const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getListings()
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.area.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = (listingId: string, title: string) => {
    showToast(`"${title}" has been approved`, 'success');
    setListings((prev) => prev.map((l) => l.listingId === listingId ? { ...l, status: 'ACTIVE' } : l));
  };

  const handleDeactivate = (listingId: string, title: string) => {
    showToast(`"${title}" has been deactivated`, 'info');
    setListings((prev) => prev.map((l) => l.listingId === listingId ? { ...l, status: 'INACTIVE' } : l));
  };

  return (
    <DashboardLayout
      type="admin"
      title="Listings Management"
      subtitle="Approve, review, or deactivate parking space listings across Bengaluru."
    >
      <div className="space-y-5">
        {/* Search */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search listings by title, area, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              All Listings ({filtered.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((n) => <div key={n} className="h-14 bg-slate-100 rounded-2xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Listing</th>
                    <th className="px-6 py-3 font-semibold">Area</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Rating</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((listing) => (
                    <tr key={listing.listingId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 max-w-[180px] truncate">{listing.title}</p>
                        <p className="text-slate-500 text-[11px] truncate max-w-[180px]">{listing.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span>{listing.area}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600">
                        ₹{listing.pricePerHour}/hr
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold">{listing.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${STATUS_COLORS[listing.status] || 'bg-slate-100 text-slate-700'}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/parking/${listing.listingId}`}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition"
                            title="View listing"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {listing.status !== 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(listing.listingId, listing.title)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(listing.listingId, listing.title)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <XCircle className="w-3 h-3" />
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No listings found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
