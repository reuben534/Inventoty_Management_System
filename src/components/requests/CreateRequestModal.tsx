import React, { useState, useEffect } from 'react';
import { X, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProduct?: Product | null;
  onCreated: () => void;
}

export function CreateRequestModal({
  isOpen,
  onClose,
  defaultProduct,
  onCreated,
}: CreateRequestModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string | number | ''>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Operations');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getProducts({ limit: 100 }).then((res) => {
        setProducts(res.products || []);
        if (defaultProduct) {
          setProductId(defaultProduct.id);
          setSelectedProduct(defaultProduct);
        } else if (res.products && res.products.length > 0) {
          setProductId(res.products[0].id);
          setSelectedProduct(res.products[0]);
        }
      });
      setQuantity(1);
      setReason('');
      setDepartment(user?.department || 'Operations');
    }
  }, [isOpen, defaultProduct, user]);

  const handleProductChange = (id: string | number) => {
    setProductId(id);
    const p = products.find((x) => String(x.id) === String(id)) || null;
    setSelectedProduct(p);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      error('Please select a product.');
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      error('Requested quantity must be at least 1.');
      return;
    }
    if (!reason.trim()) {
      error('Please provide a reason for this requisition.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createRequest({
        product_id: Number(productId),
        requested_quantity: numQty,
        reason: reason.trim(),
        department: department.trim(),
      });
      success(`Requisition ${res.requestCode} submitted for manager review.`);
      onCreated();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Stock Request</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product Item *
            </label>
            <select
              required
              value={productId}
              onChange={(e) => handleProductChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Choose item</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock: {p.quantity} {p.unit_of_measure}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Warehouse: {selectedProduct.warehouse_name}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Available: {selectedProduct.quantity} {selectedProduct.unit_of_measure}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department / Team
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Operations"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Reason for Request *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Replenishment for assembly station 3, field repair dispatch..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

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
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
