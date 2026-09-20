import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { parkingApi } from '../../api/parking';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

export const BookingFlowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // parking listing id
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [checking, setChecking] = useState(false);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setChecking(true);
    try {
      const resp = await parkingApi.checkAvailability(id, date, startTime, endTime);
      if (resp.requestedRange.isAvailable) {
        navigate(`/checkout/${id}?date=${date}&startTime=${startTime}&endTime=${endTime}`);
      } else {
        showToast('This parking space is already booked for the selected time. Please choose another slot.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to check availability', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md mt-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Select Date &amp; Time</h1>
      <form onSubmit={handleCheckAvailability} className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <span className="mx-2">–</span>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition disabled:bg-slate-300"
        >
          {checking ? 'Checking...' : (<><ChevronRight className="w-4 h-4" />Check Availability</>)}
        </button>
      </form>
    </div>
  );
};
