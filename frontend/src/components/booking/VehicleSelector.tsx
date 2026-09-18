import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleType } from '../../types/vehicle';
import { vehiclesApi } from '../../api/vehicles';
import { Car, Plus, Check, Zap, Bike } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface VehicleSelectorProps {
  selectedVehicleId: string;
  onSelect: (vehicle: Vehicle) => void;
  allowedVehicleTypes?: VehicleType[];
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicleId,
  onSelect,
  allowedVehicleTypes
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const [newNumber, setNewNumber] = useState('');
  const [newType, setNewType] = useState<VehicleType>('CAR');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');

  const loadVehicles = async () => {
    try {
      const list = await vehiclesApi.list();
      setVehicles(list);
      if (list.length > 0 && !selectedVehicleId) {
        onSelect(list[0]);
      }
    } catch (e) {
      console.error('Failed to load vehicles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim() || !newMake.trim() || !newModel.trim()) {
      showToast('Please fill in vehicle details', 'error');
      return;
    }

    try {
      const created = await vehiclesApi.create({
        vehicleNumber: newNumber.trim(),
        vehicleType: newType,
        make: newMake.trim(),
        model: newModel.trim(),
        color: newColor.trim() || 'White'
      });
      setVehicles((prev) => [created, ...prev]);
      onSelect(created);
      setIsAdding(false);
      showToast('Vehicle added successfully', 'success');
      // Reset form
      setNewNumber('');
      setNewMake('');
      setNewModel('');
      setNewColor('');
    } catch {
      showToast('Failed to add vehicle', 'error');
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'EV':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      case 'BIKE':
        return <Bike className="w-4 h-4 text-amber-600" />;
      default:
        return <Car className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Vehicle for Reservation
        </label>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddVehicle}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in zoom-in-95"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                License Plate Number *
              </label>
              <input
                type="text"
                placeholder="e.g. KA-01-AB-1234"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none uppercase"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Vehicle Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as VehicleType)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="CAR">Car / Sedan</option>
                <option value="SUV">SUV / Compact SUV</option>
                <option value="EV">Electric Vehicle (EV)</option>
                <option value="BIKE">Motorbike / Scooter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Make *</label>
              <input
                type="text"
                placeholder="e.g. Hyundai, Tata"
                value={newMake}
                onChange={(e) => setNewMake(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Model *</label>
              <input
                type="text"
                placeholder="e.g. Creta, Nexon EV"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Color</label>
              <input
                type="text"
                placeholder="e.g. White, Grey"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              Save & Use Vehicle
            </button>
          </div>
        </form>
      )}

      {/* List of User Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {vehicles.map((v) => {
          const isSelected = selectedVehicleId === v.vehicleId;
          const isCompatible = !allowedVehicleTypes || allowedVehicleTypes.includes(v.vehicleType);

          return (
            <div
              key={v.vehicleId}
              onClick={() => isCompatible && onSelect(v)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : isCompatible
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                  {getVehicleIcon(v.vehicleType)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-900 truncate tracking-wide uppercase">
                      {v.vehicleNumber}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {v.vehicleType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {v.make} {v.model} • {v.color}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
