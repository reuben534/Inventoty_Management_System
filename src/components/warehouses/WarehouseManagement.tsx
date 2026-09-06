import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Plus, Edit2, MapPin, User, Phone, Package, ArrowRightLeft, X, Loader2 } from 'lucide-react';
import { Warehouse, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface WarehouseManagementProps {
  onNavigateToTransfers: () => void;
}

export function WarehouseManagement({ onNavigateToTransfers }: WarehouseManagementProps) {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { success, error } = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.getWarehouses();
      setWarehouses(res.warehouses || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenAdd = () => {
    setEditingWarehouse(null);
    setName('');
    setAddress('');
    setManagerName('');
    setContactNumber('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setName(w.name);
    setAddress(w.address || '');
    setManagerName(w.manager_name || '');
    setContactNumber(w.contact_number || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Warehouse name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Warehouse> = {
        name: name.trim(),
        address: address.trim(),
        manager_name: managerName.trim(),
        contact_number: contactNumber.trim(),
      };

      if (editingWarehouse) {
        await api.updateWarehouse(editingWarehouse.id, payload);
        success('Warehouse facility updated.');
      } else {
        await api.createWarehouse(payload);
        success('New warehouse registered.');
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      error(err.message || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  const canManage = role === 'admin' || role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Warehouse Storage Facilities</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Physical distribution centers, fulfillment bays, and multi-location inventory holdings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToTransfers}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Facility Transfers</span>
          </button>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading facilities...</div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">No facilities registered.</div>
        ) : (
          warehouses.map((w) => (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
                      <WarehouseIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{w.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">{w.warehouse_code}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleOpenEdit(w)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{w.address || 'Address not listed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Manager: {w.manager_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{w.contact_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Package className="w-3.5 h-3.5" />
                  <span>{w.product_count || 0} unique SKUs</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {(w.total_stock_quantity || 0).toLocaleString()} units
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingWarehouse ? 'Edit Facility' : 'Register New Warehouse'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Central Logistics Hub - East"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address / Logistics Park
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="400 Logistics Blvd, Dock 12"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Facility Manager
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Manager Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingWarehouse ? 'Save Changes' : 'Create Facility'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
