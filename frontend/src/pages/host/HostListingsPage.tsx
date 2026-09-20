import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { parkingApi } from '../../api/parking';
import { apiClient } from '../../api/client';
import { ParkingListing } from '../../types/parking';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { Rating } from '../../components/common/Rating';
import { PlusCircle, Power, Trash2, Eye, MapPin, Warehouse } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const HostListingsPage: React.FC = () => {
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadListings = async () => {
    setLoading(true);
    try {
      // 1. Fetch host's listing summaries
      const summaryRes = await apiClient.get<any>('/host/listings-summary');
      const data = summaryRes.data || summaryRes;
      const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);

      // 2. Fetch full listing details for each
      const fullListings = await Promise.all(
        items.map((item: any) => parkingApi.getById(item.listingId))
      );
      setListings(fullListings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleToggleStatus = async (listing: ParkingListing) => {
    const nextStatus = listing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await parkingApi.updateStatus(listing.listingId, nextStatus);
      setListings((prev) =>
        prev.map((l) => (l.listingId === listing.listingId ? { ...l, status: nextStatus } : l))
      );
      showToast(`Listing is now ${nextStatus.toLowerCase()}`, 'info');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate and remove this listing?')) return;
    try {
      await parkingApi.delete(id);
      showToast('Listing removed', 'info');
      loadListings();
    } catch {
      showToast('Failed to delete listing', 'error');
    }
  };

  return (
    <DashboardLayout
      type="host"
      title="My Parking Spaces"
      subtitle="Manage your listed driveways, basement bays, and commercial complexes across Bengaluru."
      action={
        <Link
          to="/host/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add New Bay</span>
        </Link>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">No spaces listed yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              List your empty parking bay to start earning passive income.
            </p>
            <Link
              to="/host/create"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              List Space
            </Link>
          </div>
        ) : (
          listings.map((l) => (
            <div
              key={l.listingId}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={l.photos[0]}
                  alt={l.title}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        l.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {l.status}
                    </span>
                    <span className="text-slate-400 text-[11px] font-semibold">{l.parkingType}</span>
                    <Rating rating={l.rating} reviewCount={l.reviewCount} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{l.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{l.address}, {l.area}</span>
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <PriceDisplay pricePerHour={l.pricePerHour} pricePerDay={l.pricePerDay} size="sm" />
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{l.capacity} bays</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(l)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    l.status === 'ACTIVE'
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Toggle Listing Active / Inactive"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{l.status === 'ACTIVE' ? 'Pause' : 'Activate'}</span>
                </button>

                <Link
                  to={`/parking/${l.listingId}`}
                  className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                  title="View Public Listing"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(l.listingId)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
