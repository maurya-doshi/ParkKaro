import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { vehiclesApi } from '../../api/vehicles';
import { Vehicle, VehicleType } from '../../types/vehicle';
import { Car, Zap, Bike, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const [number, setNumber] = useState('');
  const [type, setType] = useState<VehicleType>('CAR');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehiclesApi.list();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehiclesApi.create({
        vehicleNumber: number.trim().toUpperCase(),
        vehicleType: type,
        make: make.trim(),
        model: model.trim(),
        color: color.trim() || 'White'
      });
      showToast('Vehicle registered successfully', 'success');
      setIsAdding(false);
      setNumber('');
      setMake('');
      setModel('');
      setColor('');
      loadVehicles();
    } catch {
      showToast('Failed to add vehicle', 'error');
    }
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setNumber(vehicle.vehicleNumber);
    setType(vehicle.vehicleType);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setColor(vehicle.color);
    setIsAdding(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicle) return;
    try {
      await vehiclesApi.update(editVehicle.vehicleId, {
        vehicleNumber: number.trim().toUpperCase(),
        vehicleType: type,
        make: make.trim(),
        model: model.trim(),
        color: color.trim() || 'White'
      });
      showToast('Vehicle updated successfully', 'success');
      setIsAdding(false);
      setEditVehicle(null);
      setNumber('');
      setMake('');
      setModel('');
      setColor('');
      loadVehicles();
    } catch {
      showToast('Failed to update vehicle', 'error');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Remove this vehicle from your profile?')) return;
    try {
      await vehiclesApi.delete(vehicleId);
      showToast('Vehicle deleted', 'info');
      loadVehicles();
    } catch {
      showToast('Failed to remove vehicle', 'error');
    }
  };

  return (
    <DashboardLayout
      type="driver"
      title="My Registered Vehicles"
      subtitle="Manage cars, SUVs, EVs, and bikes registered for automated gate recognition and QR entry."
      action={
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Vehicle</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Add vehicle form */}
        {isAdding && (
  <form
    onSubmit={editVehicle ? handleUpdate : handleAdd}
    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in fade-in"
  >
    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
      {editVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          License Plate Number *
        </label>
        <input
          type="text"
          placeholder="e.g. KA-03-MN-8921"
          required
          value={number}
          onChange={(e) => setNumber(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Vehicle Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as VehicleType)}
          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="CAR">Car / Sedan / Hatchback</option>
          <option value="SUV">SUV / MUV / Compact SUV</option>
          <option value="EV">Electric Vehicle (EV)</option>
          <option value="BIKE">Two-Wheeler / Motorbike</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Make *
        </label>
        <input
          type="text"
          placeholder="e.g. Tata, Hyundai, Kia, Honda"
          required
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Model & Color
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Nexon EV"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
          <input
            type="text"
            placeholder="White"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>
    </div>
    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={() => {
          setIsAdding(false);
          setEditVehicle(null);
        }}
        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
      >
        {editVehicle ? 'Update Vehicle' : 'Save Vehicle'}
      </button>
    </div>
  </form>
)}


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA-03-MN-8921"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Vehicle Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="CAR">Car / Sedan / Hatchback</option>
                  <option value="SUV">SUV / MUV / Compact SUV</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="BIKE">Two-Wheeler / Motorbike</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata, Hyundai, Kia, Honda"
                  required
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Model & Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Nexon EV"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="White"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        )}

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.vehicleId}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700">
                    {v.vehicleType === 'EV' && <Zap className="w-5 h-5 text-emerald-600" />}
                    {v.vehicleType === 'BIKE' && <Bike className="w-5 h-5 text-amber-600" />}
                    {v.vehicleType !== 'EV' && v.vehicleType !== 'BIKE' && (
                      <Car className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 uppercase tracking-wider">
                    {v.vehicleType}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 tracking-wider font-mono uppercase">
                  {v.vehicleNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {v.make} {v.model} • {v.color}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Verified Plate
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(v.vehicleId)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                  title="Remove vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
