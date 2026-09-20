import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { hostApi, HostEarningsBreakdown, PayoutRecord } from '../../api/host';
import {
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const HostEarningsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [earnings, setEarnings] = useState<HostEarningsBreakdown | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([hostApi.getEarnings(period), hostApi.getPayouts()])
      .then(([earn, pays]) => {
        setEarnings(earn);
        setPayouts(pays);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [period]);

  const handleRequestPayout = () => {
    setRequestingPayout(true);
    setTimeout(() => {
      setRequestingPayout(false);
      showToast('Payout request for ₹14,220 submitted! Transfer initiated.', 'success');
      setPayouts((prev) => [
        {
          payoutId: `payout_${Date.now().toString(36)}`,
          amount: 14220,
          status: 'PROCESSING',
          period: '2026-09',
          currency: 'INR',
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }, 800);
  };

  if (loading || !earnings) {
    return (
      <DashboardLayout type="host" title="Earnings & Payouts">
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-white rounded-3xl" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="host"
      title="Host Earnings & Financial Hub"
      subtitle="Track your gross reservation revenue, net payouts, bank deposits, and tax statements."
      action={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => showToast('Statement PDF downloaded', 'success')}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tax Statement</span>
          </button>
          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={requestingPayout}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{requestingPayout ? 'Initiating...' : 'Request Payout'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: 'week', label: 'Past 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                period === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Net Host Earnings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              ₹{earnings.netEarnings.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Ready for payout
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Gross Reservation Volume
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              ₹{earnings.grossRevenue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Total booking value
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Platform Fee (10%)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">
              ₹{(earnings.platformFees || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Covers guarantee & AI
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bookings Fulfilled
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {earnings.totalBookings}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              100% verified check-ins
            </span>
          </div>
        </div>

        {/* Daily Revenue Bar Visualizer */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daily Revenue Trajectory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Net earnings across Bengaluru bays</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3 items-end h-48 pt-6">
            {earnings.breakdown.map((b) => {
              const heightPercent = Math.min(100, Math.round((b.net / 3500) * 100));

              return (
                <div key={b.date} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">₹{b.net}</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-xl transition-all duration-500 hover:opacity-90"
                    title={`${b.bookings} bookings on ${b.date}`}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(b.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bank & Payouts Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Payout History</h3>
              <p className="text-xs text-slate-500">
                Direct NEFT / IMPS transfers to HDFC Bank (A/C ending in ••8901)
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bank Account Verified</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Initiated At</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.payoutId} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 font-mono font-bold text-slate-900">{p.payoutId}</td>
                    <td className="py-3.5 text-slate-600 font-medium">
                      {p.period}
                    </td>
                    <td className="py-3.5 font-black text-emerald-600 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
