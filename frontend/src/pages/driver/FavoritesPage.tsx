import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { favoritesApi } from '../../api/favorites';
import { ParkingListing } from '../../types/parking';
import { ParkingCard } from '../../components/parking/ParkingCard';
import { Heart, Search } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const list = await favoritesApi.list();
      setFavorites(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <DashboardLayout
      type="driver"
      title="Saved Parking Spaces"
      subtitle="Quick access to your preferred Bengaluru parking locations and daily commute spots."
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No saved spaces yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click the heart icon on any parking card to save your favorite spots for fast one-tap
            rebooking.
          </p>
          <Link
            to="/search"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Spots</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((listing) => (
            <ParkingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
