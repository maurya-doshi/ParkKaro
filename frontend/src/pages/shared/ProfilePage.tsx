import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  Key,
  Bell,
  Car,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    showToast('Profile updated successfully', 'success');
    setSaving(false);
  };

  const dashboardType = role === 'HOST' ? 'host' : role === 'ADMIN' ? 'admin' : 'driver';

  return (
    <DashboardLayout
      type={dashboardType}
      title="My Profile"
      subtitle="Manage your personal information, preferences, and account security."
    >
      <div className="space-y-6 max-w-2xl">
        {/* Profile Picture */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" />
            Personal Information
          </h3>

          <div className="flex items-start gap-6 mb-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-blue-100">
                <img
                  src={
                    user?.profileImage ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                title="Change photo"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{user?.name}</h4>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  role === 'DRIVER' ? 'bg-blue-100 text-blue-700' :
                  role === 'HOST' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {role}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Email is managed via AWS Cognito and cannot be changed here.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            Security & Password
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Your account is secured via AWS Cognito. To change your password, use the Cognito hosted UI
            or the Forgot Password flow from the login screen.
          </p>
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-900">Multi-Factor Authentication</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">MFA is active on your account via Cognito TOTP.</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Booking confirmations', sub: 'Instant email + in-app', checked: true },
              { label: 'Upcoming session reminders', sub: '30 min before start', checked: true },
              { label: 'Payment receipts', sub: 'After each transaction', checked: true },
              { label: 'Promotional offers', sub: 'Weekly digest', checked: false }
            ].map((pref) => (
              <label
                key={pref.label}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{pref.label}</p>
                  <p className="text-[11px] text-slate-500">{pref.sub}</p>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors ${
                  pref.checked ? 'bg-blue-600' : 'bg-slate-200'
                }`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    pref.checked ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Role Switcher */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Demo Role Switcher
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            ParkShare is a demo marketplace. Switch persona to explore the platform from different perspectives.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { r: 'DRIVER' as const, label: 'Driver', icon: Car, color: 'blue' },
              { r: 'HOST' as const, label: 'Host', icon: Layers, color: 'emerald' },
              { r: 'ADMIN' as const, label: 'Admin', icon: Shield, color: 'purple' }
            ].map(({ r, label, icon: Icon, color }) => (
              <button
                key={r}
                type="button"
                onClick={() => { switchRole(r); showToast(`Switched to ${label} persona`, 'success'); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition border ${
                  role === r
                    ? `bg-${color}-600 text-white border-${color}-600 shadow-sm`
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {role === r && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
