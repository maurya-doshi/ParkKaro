import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../../components/search/SearchBar';
import { FilterPanel, FilterState } from '../../components/search/FilterPanel';
import { SortDropdown } from '../../components/search/SortDropdown';
import { ParkingGrid } from '../../components/parking/ParkingGrid';
import { MapPanel } from '../../components/parking/MapPanel';
import { parkingApi } from '../../api/parking';
import { ParkingListing, ParkingType, VehicleType } from '../../types/parking';
import { SlidersHorizontal, Map, List, X, Sparkles } from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const areaParam = searchParams.get('area') || '';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const vehicleTypeParam = (searchParams.get('vehicleType') as VehicleType) || '';
  const parkingTypeParam = (searchParams.get('parkingType') as ParkingType) || '';
  const sortByParam = (searchParams.get('sortBy') as 'price' | 'rating' | 'distance') || 'rating';

  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    parkingType: parkingTypeParam,
    vehicleType: vehicleTypeParam,
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
    amenities: []
  });

  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>(sortByParam);

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.search({
        area: areaParam || undefined,
        date: dateParam || undefined,
        parkingType: filters.parkingType || undefined,
        vehicleType: filters.vehicleType || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        amenities: filters.amenities.length > 0 ? filters.amenities.join(',') : undefined,
        sortBy
      });
      setListings(res.items);
    } catch (e) {
      console.error('Failed to load listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [areaParam, dateParam, filters, sortBy]);

  const handleResetFilters = () => {
    setFilters({
      parkingType: '',
      vehicleType: '',
      minPrice: undefined,
      maxPrice: undefined,
      rating: undefined,
      amenities: []
    });
    setSortBy('rating');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sticky Filter Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200/80 shadow-xs py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:max-w-2xl">
            <SearchBar
              initialArea={areaParam}
              initialDate={dateParam}
              initialVehicleType={filters.vehicleType}
              compact
              onSearch={(params) => {
                const next = new URLSearchParams(searchParams);
                if (params.area) next.set('area', params.area);
                else next.delete('area');
                if (params.date) next.set('date', params.date);
                if (params.vehicleType) next.set('vehicleType', params.vehicleType);
                setSearchParams(next);
              }}
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
            {/* Filter Toggle Mobile/Tablet */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {filters.amenities.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            <SortDropdown value={sortBy} onChange={setSortBy} />

            {/* Mobile View Toggle (Map vs List) */}
            <div className="lg:hidden flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className={`p-1.5 rounded-lg ${mobileView === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileView('map')}
                className={`p-1.5 rounded-lg ${mobileView === 'map' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                title="Map View"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {/* Results Header Info */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {areaParam ? `Parking in ${areaParam}` : 'All Verified Bengaluru Spaces'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {listings.length} verified parking {listings.length === 1 ? 'spot' : 'spots'}
              {dateParam ? ` • ${new Date(dateParam).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </p>
          </div>
        </div>

        {/* Desktop Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar Filters (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-36">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>

          {/* Results Grid / Map */}
          <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* List Column */}
            <div
              className={`xl:col-span-7 ${
                mobileView === 'map' ? 'hidden xl:block' : 'block'
              }`}
            >
              <ParkingGrid
                listings={listings}
                loading={loading}
                activeListingId={activeListingId}
                onHoverListing={setActiveListingId}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Map Column (Sticky on desktop, toggleable on mobile) */}
            <div
              className={`xl:col-span-5 sticky top-36 h-[calc(100vh-170px)] min-h-[460px] ${
                mobileView === 'list' ? 'hidden xl:block' : 'block'
              }`}
            >
              <MapPanel
                listings={listings}
                activeListingId={activeListingId}
                onSelectListing={setActiveListingId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Filter Search</h3>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              className="border-0 p-0 shadow-none"
            />

            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Apply Filters ({listings.length} results)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
