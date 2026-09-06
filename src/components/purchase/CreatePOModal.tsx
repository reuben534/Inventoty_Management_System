import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Trash2, Loader2, Banknote } from 'lucide-react';
import { Product, Supplier, Warehouse } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatZAR } from '../../utils/formatters';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ItemRow {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export function CreatePOModal({ isOpen, onClose, onCreated }: CreatePOModalProps) {
  const { success, error } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState<number>(8);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const [items, setItems] = useState<ItemRow[]>([
    { product_id: 0, quantity: 10, unit_price: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSuppliers().then((r) => {
        setSuppliers(r.suppliers || []);
        if (r.suppliers && r.suppliers.length > 0) setSupplierId(r.suppliers[0].id);
      });
      api.getWarehouses().then((r) => {
        setWarehouses(r.warehouses || []);
        if (r.warehouses && r.warehouses.length > 0) setWarehouseId(r.warehouses[0].id);
      });
      api.getProducts({ limit: 100 }).then((r) => {
        setProducts(r.products || []);
        if (r.products && r.products.length > 0) {
          setItems([{ product_id: r.products[0].id, quantity: 10, unit_price: r.products[0].cost_price }]);
        }
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setExpectedDate(nextWeek.toISOString().slice(0, 10));
      setNotes('');
      setTaxRate(8);
      setDiscountAmount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: defaultProd ? defaultProd.id : 0,
        quantity: 10,
        unit_price: defaultProd ? defaultProd.cost_price : 0,
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === 'product_id') {
        const prod = products.find((p) => p.id === Number(value));
        copy[idx] = {
          ...copy[idx],
          product_id: Number(value),
          unit_price: prod ? prod.cost_price : copy[idx].unit_price,
        };
      } else {
        copy[idx] = {
          ...copy[idx],
          [field]: Number(value),
        };
      }
      return copy;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId) {
      error('Please select supplier and destination warehouse.');
      return;
    }
    if (items.some((it) => !it.product_id || it.quantity <= 0 || it.unit_price < 0)) {
      error('Please verify all items have valid products, quantities, and prices.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPurchaseOrder({
        supplier_id: Number(supplierId),
        warehouse_id: Number(warehouseId),
        expected_delivery_date: expectedDate,
        notes: notes.trim(),
        tax_rate: Number(taxRate),
        discount_amount: Number(discountAmount),
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });

      success(`Purchase order ${res.poNumber} created with status: ${res.status}.`);
      onCreated();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to generate purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Purchase Order</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {/* Top Options: Supplier & Destination Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.supplier_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receiving Warehouse *
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Ordered Inventory Items</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-500 uppercase">
                <div className="col-span-5">Product SKU / Name</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price ($)</div>
                <div className="col-span-2 text-right">Line Total</div>
                <div className="col-span-1 text-right">Del</div>
              </div>

              {items.map((it, idx) => {
                const lineTotal = (it.quantity || 0) * (it.unit_price || 0);

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center">
                    <div className="col-span-5">
                      <select
                        value={it.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatZAR(lineTotal)}
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Order Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions, dock requirements..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono font-semibold">{formatZAR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-500">
                  <span>Tax Rate:</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-12 px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-right text-xs"
                  />
                  <span>%</span>
                </div>
                <span className="font-mono">+{formatZAR(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-500">
                  <span>Discount (R):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-16 px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-right text-xs"
                  />
                </div>
                <span className="font-mono">-{formatZAR(discountAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatZAR(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2 shrink-0">
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
              <span>Generate Purchase Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
