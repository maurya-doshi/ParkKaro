import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { User } from '../../types/user';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  ShieldCheck,
  Car,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  DRIVER: 'bg-blue-50 text-blue-700',
  HOST: 'bg-emerald-50 text-emerald-700',
  ADMIN: 'bg-purple-50 text-purple-700'
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  SUSPENDED: 'bg-rose-50 text-rose-700',
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-700'
};

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleSuspend = (userId: string, name: string) => {
    showToast(`${name} has been suspended`, 'info');
    setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, status: 'SUSPENDED' as any } : u));
  };

  const handleActivate = (userId: string, name: string) => {
    showToast(`${name}'s account has been reactivated`, 'success');
    setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, status: 'ACTIVE' as any } : u));
  };

  return (
    <DashboardLayout
      type="admin"
      title="User Management"
      subtitle="View, verify, and moderate all platform users — drivers, hosts, and admins."
    >
      <div className="space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {['ALL', 'DRIVER', 'HOST', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterRole === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              All Users ({filtered.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => <div key={n} className="h-14 bg-slate-100 rounded-2xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Joined</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            {user.profileImage ? (
                              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'}`}>
                          {user.role === 'DRIVER' && <Car className="w-2.5 h-2.5 inline mr-1" />}
                          {user.role === 'HOST' && <Layers className="w-2.5 h-2.5 inline mr-1" />}
                          {user.role === 'ADMIN' && <ShieldCheck className="w-2.5 h-2.5 inline mr-1" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${STATUS_COLORS[(user as any).status] || 'bg-slate-100 text-slate-700'}`}>
                          {(user as any).status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(user as any).status !== 'SUSPENDED' ? (
                            <button
                              type="button"
                              onClick={() => handleSuspend(user.userId, user.name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <XCircle className="w-3 h-3" />
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(user.userId, user.name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Activate
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
                  No users matching your search or filter.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
