import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { ProfilePage } from '../shared/ProfilePage';

/**
 * ProfileSettingsPage – a thin wrapper that re‑uses the existing ProfilePage UI.
 * It keeps the URL hierarchy clear (`/profile/settings`) while delegating the
 * actual UI to the shared component.
 */
export const ProfileSettingsPage: React.FC = () => {
  const { role } = useAuth();
  const dashboardType = role === 'HOST' ? 'host' : role === 'ADMIN' ? 'admin' : 'driver';

  return (
    <DashboardLayout
      type={dashboardType}
      title="Profile & Settings"
      subtitle="Manage your personal information, security, and notifications."
    >
      <ProfilePage />
    </DashboardLayout>
  );
};
