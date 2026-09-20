import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { Dispute } from '../../types/api';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-rose-50 text-rose-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  DISMISSED: 'bg-slate-100 text-slate-600'
};

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  OPEN: AlertTriangle,
  UNDER_REVIEW: Clock,
  RESOLVED: CheckCircle2,
  DISMISSED: XCircle
};

export const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getDisputes()
      .then(setDisputes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (disputeId: string) => {
    if (!resolution.trim()) return;
    await adminApi.resolveDispute(disputeId, resolution.trim());
    setDisputes((prev) =>
      prev.map((d) =>
        d.disputeId === disputeId
          ? { ...d, status: 'RESOLVED', resolution: resolution.trim() }
          : d
      )
    );
    showToast('Dispute resolved successfully', 'success');
    setSelectedDispute(null);
    setResolution('');
  };

  const handleDismiss = async (disputeId: string) => {
    await adminApi.resolveDispute(disputeId, 'Dismissed by admin');
    setDisputes((prev) =>
      prev.map((d) =>
        d.disputeId === disputeId ? { ...d, status: 'DISMISSED' } : d
      )
    );
    showToast('Dispute dismissed', 'info');
    setSelectedDispute(null);
  };

  const open = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
  const resolved = disputes.filter((d) => d.status === 'RESOLVED' || d.status === 'DISMISSED');

  return (
    <DashboardLayout
      type="admin"
      title="Dispute Resolution Center"
      subtitle="Review and resolve open disputes raised by drivers and hosts on the ParkKaro platform."
    >
      <div className="space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: open.length, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Under Review', value: disputes.filter(d => d.status === 'UNDER_REVIEW').length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Resolved', value: disputes.filter(d => d.status === 'RESOLVED').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total', value: disputes.length, color: 'text-blue-600', bg: 'bg-blue-50' }
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-transparent`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-black ${card.color} mt-0.5`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Active Disputes */}
        {open.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Disputes ({open.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {open.map((dispute) => {
                const StatusIcon = STATUS_ICONS[dispute.status] || AlertTriangle;
                return (
                  <div key={dispute.disputeId} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${STATUS_COLORS[dispute.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {dispute.status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{dispute.disputeId}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{dispute.reason}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dispute.description}</p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Booking: <span className="font-mono text-slate-600">{dispute.bookingId}</span> ·{' '}
                          {new Date(dispute.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedDispute(dispute); setResolution(''); }}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Disputes */}
        {resolved.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Resolved / Dismissed ({resolved.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {resolved.map((dispute) => {
                const StatusIcon = STATUS_ICONS[dispute.status] || CheckCircle2;
                return (
                  <div key={dispute.disputeId} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${STATUS_COLORS[dispute.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{dispute.reason}</p>
                      {dispute.resolution && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Resolution: {dispute.resolution}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && disputes.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900">No open disputes</h3>
            <p className="text-xs text-slate-500 mt-1">The platform is running smoothly. All issues are resolved.</p>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-1">Resolve Dispute</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedDispute.reason}</p>

            <textarea
              rows={4}
              placeholder="Write your resolution or admin decision..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleResolve(selectedDispute.disputeId)}
                disabled={!resolution.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 transition"
              >
                Mark Resolved
              </button>
              <button
                type="button"
                onClick={() => handleDismiss(selectedDispute.disputeId)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
