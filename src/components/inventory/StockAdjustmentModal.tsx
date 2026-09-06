import React, { useState, useEffect } from 'react';
import { X, Sliders, ArrowUpRight, ArrowDownLeft, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  allProducts?: Product[];
  onAdjusted: () => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product: selectedProduct,
  allProducts = [],
  onAdjusted,
}: StockAdjustmentModalProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [productId, setProductId] = useState<number | ''>('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Return'>('Stock In');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (selectedProduct) {
        setProductId(selectedProduct.id);
        setActiveProduct(selectedProduct);
        setLocation(selectedProduct.warehouse_name || 'Main Warehouse');
      } else if (allProducts.length > 0) {
        setProductId(allProducts[0].id);
        setActiveProduct(allProducts[0]);
        setLocation(allProducts[0].warehouse_name || 'Main Warehouse');
      }
      setAdjustmentType('Stock In');
      setQuantity(1);
      setReason('');
    }
  }, [isOpen, selectedProduct, allProducts]);

  const handleProductChange = (id: number) => {
    setProductId(id);
    const p = allProducts.find((item) => item.id === id);
    if (p) {
      setActiveProduct(p);
      setLocation(p.warehouse_name || 'Main Warehouse');
    }
  };

  if (!isOpen) return null;

  const currentQty = activeProduct?.quantity || 0;
  const numQty = Number(quantity) || 0;

  let newQty = currentQty;
  if (adjustmentType === 'Stock In' || adjustmentType === 'Return') {
    newQty = currentQty + numQty;
  } else if (adjustmentType === 'Stock Out') {
    newQty = currentQty - numQty;
  } else if (adjustmentType === 'Stock Adjustment') {
    newQty = numQty; // Set count
  }

  const isInvalidNegative = newQty < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      error('Please select a product to adjust.');
      return;
    }
    if (numQty <= 0 && adjustmentType !== 'Stock Adjustment') {
      error('Quantity must be greater than zero.');
      return;
    }
    if (isInvalidNegative) {
      error('Resulting inventory quantity cannot be negative.');
      return;
    }
    if (!reason.trim()) {
      error('Please provide a mandatory reason for this inventory adjustment.');
      return;
    }

    setLoading(true);
    try {
      await api.adjustStock({
        product_id: Number(productId),
        adjustment_type: adjustmentType,
        quantity: numQty,
        reason: reason.trim(),
        location: location.trim(),
      });
      success(`Stock updated: ${activeProduct?.name} is now ${newQty} ${activeProduct?.unit_of_measure}`);
      onAdjusted();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Stock Adjustment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Select Product if not locked */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product SKU *
            </label>
            {selectedProduct ? (
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{selectedProduct.name}</div>
                <div className="text-slate-500 font-mono mt-0.5">
                  SKU: {selectedProduct.sku} • Current Stock: {selectedProduct.quantity} {selectedProduct.unit_of_measure}
                </div>
              </div>
            ) : (
              <select
                required
                value={productId}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Choose item to adjust</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.quantity} {p.unit_of_measure}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Adjustment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Operation Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'Stock In', label: 'Stock In (+)', icon: ArrowDownLeft, color: 'hover:border-emerald-500' },
                { type: 'Stock Out', label: 'Stock Out (-)', icon: ArrowUpRight, color: 'hover:border-rose-500' },
                { type: 'Stock Adjustment', label: 'Set Count (=)', icon: Sliders, color: 'hover:border-blue-500' },
                { type: 'Return', label: 'Return (+)', icon: RotateCcw, color: 'hover:border-purple-500' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = adjustmentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAdjustmentType(item.type as any)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {adjustmentType === 'Stock Adjustment' ? 'New Total Count *' : 'Quantity Units *'}
              </label>
              <input
                type="number"
                required
                min={adjustmentType === 'Stock Adjustment' ? '0' : '1'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facility Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Warehouse, Bay 4"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Quantity Transition Preview */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Inventory Impact:</span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span className="text-slate-600 dark:text-slate-400">{currentQty}</span>
              <span className="text-slate-400">→</span>
              <span className={isInvalidNegative ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}>
                {newQty} {activeProduct?.unit_of_measure}
              </span>
            </div>
          </div>

          {isInvalidNegative && (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Error: This deduction exceeds available inventory ({currentQty} in stock).
            </div>
          )}

          {/* Reason (Mandatory) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Reason / Justification *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Inbound purchase receipt, damaged packaging disposal, cycle count adjustment..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidNegative}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
