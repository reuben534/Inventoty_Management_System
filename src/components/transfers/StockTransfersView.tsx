import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Warehouse,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  GitCompare,
} from 'lucide-react';
import { StockTransfer, Product, Warehouse as WarehouseType, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function StockTransfersView() {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { success, error } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | ''>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.getTransfers();
      setTransfers(res.transfers || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleOpenCreate = async () => {
    try {
      const [wRes, pRes] = await Promise.all([api.getWarehouses(), api.getProducts({ limit: 100 })]);
      setWarehouses(wRes.warehouses || []);
      setProducts(pRes.products || []);

      if (wRes.warehouses && wRes.warehouses.length > 1) {
        setSourceWarehouseId(wRes.warehouses[0].id);
        setDestinationWarehouseId(wRes.warehouses[1].id);
      }
      if (pRes.products && pRes.products.length > 0) {
        setProductId(pRes.products[0].id);
      }
      setQuantity(1);
      setNotes('');
      setIsModalOpen(true);
    } catch (err: any) {
      error('Failed to load facilities or products for transfer');
    }
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) {
      error('Please select both source and destination facilities.');
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      error('Source and destination facilities must be different.');
      return;
    }
    if (!productId) {
      error('Please select product item to transfer.');
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      error('Quantity must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.createTransfer({
        source_warehouse_id: Number(sourceWarehouseId),
        destination_warehouse_id: Number(destinationWarehouseId),
        product_id: Number(productId),
        quantity: numQty,
        reason: notes.trim(),
      });
      success(`Transfer ${res.transferCode} completed successfully.`);
      setIsModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      error(err.message || 'Failed to complete transfer');
    } finally {
      setSaving(false);
    }
  };

  const canTransfer = role === 'admin' || role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inter-Facility Stock Transfers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reallocate inventory stock between regional warehouses, depots, and distribution centers
          </p>
        </div>

        {canTransfer && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Facility Transfer</span>
          </button>
        )}
      </div>

      {/* Transfers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Transfer Code</th>
                <th className="px-4 py-3">Origin Facility</th>
                <th className="px-4 py-3">Destination Facility</th>
                <th className="px-4 py-3">Product Transferred</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Dispatched By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading facility transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No facility transfers on record.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {t.transfer_code}
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.source_warehouse_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.destination_warehouse_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{t.product_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">SKU: {t.sku}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {t.quantity} {t.unit_of_measure}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.created_by_name}</td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Facility Transfer</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source Facility *
                  </label>
                  <select
                    required
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination *
                  </label>
                  <select
                    required
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Item *
                </label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.quantity} {p.unit_of_measure}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Notes / Waybill Ref
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Truck license plate, driver name, shipment reason..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
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
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
