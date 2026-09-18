import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/public/LandingPage';
import { SearchResultsPage } from './pages/public/SearchResultsPage';

export const App: React.FC = () => {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar onOpenAI={() => setAiAssistantOpen(true)} />

            <main className="flex-grow">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/parking/:id" element={<div className="p-8 text-center text-slate-500">Parking Details Loading...</div>} />
                <Route path="/checkout/:id" element={<div className="p-8 text-center text-slate-500">Checkout Loading...</div>} />
                <Route path="/confirmation/:bookingId" element={<div className="p-8 text-center text-slate-500">Confirmation Loading...</div>} />
                <Route path="/become-host" element={<div className="p-8 text-center text-slate-500">Become a Host Loading...</div>} />

                {/* Driver Pages */}
                <Route path="/driver/dashboard" element={<div className="p-8 text-center text-slate-500">Driver Dashboard Loading...</div>} />
                <Route path="/driver/bookings" element={<div className="p-8 text-center text-slate-500">My Bookings Loading...</div>} />
                <Route path="/driver/vehicles" element={<div className="p-8 text-center text-slate-500">Vehicles Loading...</div>} />
                <Route path="/driver/favorites" element={<div className="p-8 text-center text-slate-500">Favorites Loading...</div>} />
                <Route path="/driver/messages" element={<div className="p-8 text-center text-slate-500">Messages Loading...</div>} />
                <Route path="/driver/notifications" element={<div className="p-8 text-center text-slate-500">Notifications Loading...</div>} />

                {/* Host Pages */}
                <Route path="/host/dashboard" element={<div className="p-8 text-center text-slate-500">Host Dashboard Loading...</div>} />
                <Route path="/host/listings" element={<div className="p-8 text-center text-slate-500">Host Listings Loading...</div>} />
                <Route path="/host/create" element={<div className="p-8 text-center text-slate-500">Create Listing Loading...</div>} />
                <Route path="/host/earnings" element={<div className="p-8 text-center text-slate-500">Earnings Loading...</div>} />

                {/* Admin Pages */}
                <Route path="/admin/dashboard" element={<div className="p-8 text-center text-slate-500">Admin Dashboard Loading...</div>} />
                <Route path="/admin/users" element={<div className="p-8 text-center text-slate-500">Admin Users Loading...</div>} />
                <Route path="/admin/listings" element={<div className="p-8 text-center text-slate-500">Admin Listings Loading...</div>} />
                <Route path="/admin/disputes" element={<div className="p-8 text-center text-slate-500">Admin Disputes Loading...</div>} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
