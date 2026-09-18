import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AIAssistantPanel } from './components/common/AIAssistantPanel';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { SearchResultsPage } from './pages/public/SearchResultsPage';
import { ParkingDetailsPage } from './pages/public/ParkingDetailsPage';

// Driver Pages
import { BookingCheckoutPage } from './pages/driver/BookingCheckoutPage';
import { BookingConfirmationPage } from './pages/driver/BookingConfirmationPage';
import { DriverDashboardPage } from './pages/driver/DriverDashboardPage';
import { MyBookingsPage } from './pages/driver/MyBookingsPage';
import { VehiclesPage } from './pages/driver/VehiclesPage';
import { FavoritesPage } from './pages/driver/FavoritesPage';
import { MessagesPage } from './pages/driver/MessagesPage';
import { NotificationsPage } from './pages/driver/NotificationsPage';

// Host Pages
import { BecomeHostPage } from './pages/host/BecomeHostPage';
import { HostDashboardPage } from './pages/host/HostDashboardPage';
import { HostListingsPage } from './pages/host/HostListingsPage';
import { CreateListingPage } from './pages/host/CreateListingPage';
import { HostEarningsPage } from './pages/host/HostEarningsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';

// Shared Pages
import { ProfilePage } from './pages/shared/ProfilePage';

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
                <Route path="/parking/:id" element={<ParkingDetailsPage />} />
                <Route path="/checkout/:id" element={<BookingCheckoutPage />} />
                <Route path="/confirmation/:bookingId" element={<BookingConfirmationPage />} />
                <Route path="/become-host" element={<BecomeHostPage />} />

                {/* Driver Pages */}
                <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
                <Route path="/driver/bookings" element={<MyBookingsPage />} />
                <Route path="/driver/vehicles" element={<VehiclesPage />} />
                <Route path="/driver/favorites" element={<FavoritesPage />} />
                <Route path="/driver/messages" element={<MessagesPage />} />
                <Route path="/driver/notifications" element={<NotificationsPage />} />

                {/* Host Pages */}
                <Route path="/host/dashboard" element={<HostDashboardPage />} />
                <Route path="/host/listings" element={<HostListingsPage />} />
                <Route path="/host/create" element={<CreateListingPage />} />
                <Route path="/host/earnings" element={<HostEarningsPage />} />

                {/* Admin Pages */}
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/listings" element={<AdminListingsPage />} />
                <Route path="/admin/disputes" element={<AdminDisputesPage />} />

                {/* Shared Pages */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>

          {/* AI Assistant Panel — Portal overlay */}
          <AIAssistantPanel
            open={aiAssistantOpen}
            onClose={() => setAiAssistantOpen(false)}
          />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
