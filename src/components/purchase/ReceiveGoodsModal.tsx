import React, { useState, useEffect } from 'react';
import { X, PackageCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onReceived: () => void;
}

export function ReceiveGoodsModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReceived,
}: ReceiveGoodsModalProps) {
  const { success, error } = useToast();
  const [poDetails, setPoDetails] = useState<any>(null);
  const [receivedMap, setReceivedMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      setLoading(true);
      api
        .getPurchaseOrder(purchaseOrder.id)
        .then((res) => {
          setPoDetails(res);
          const initialMap: Record<number, number> = {};
          (res.items || []).forEach((it: any) => {
            const pendingQty = Math.max(0, it.quantity - (it.received_quantity || 0));
            initialMap[it.id] = pendingQty;
          });
          setReceivedMap(initialMap);
        })
        .catch((err) => error(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (itemId: number, val: number) => {
    setReceivedMap((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poDetails || !poDetails.items) return;

    const itemsToReceive = poDetails.items.map((it: any) => ({
      item_id: it.id,
      received_quantity: Number(receivedMap[it.id] || 0),
    }));

    if (itemsToReceive.every((it: any) => it.received_quantity === 0)) {
      error('Please specify received quantities greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await api.receivePOGoods(purchaseOrder.id, {
        received_items: itemsToReceive.map((it) => ({
          item_id: it.item_id,
          quantity_received: it.received_quantity,
        })),
      });
      success(`Goods received for ${purchaseOrder.po_number}. Inventory stock updated.`);
      onReceived();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to receive goods');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Inbound Goods Receiving</h3>
              <div className="text-xs text-slate-400 font-mono">PO: {purchaseOrder.po_number}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
            Confirm physically verified quantities entering warehouse dock <strong>{purchaseOrder.warehouse_name}</strong>.
            Inventory records will be incremented automatically.
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading line items...</div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-500 uppercase">
                <div className="col-span-5">Product SKU / Name</div>
                <div className="col-span-2 text-center">Ordered</div>
                <div className="col-span-2 text-center">Previously Recv</div>
                <div className="col-span-3 text-right">Receive Now</div>
              </div>

              {poDetails?.items?.map((it: any) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 p-3 items-center">
                  <div className="col-span-5">
                    <div className="font-bold text-slate-900 dark:text-white">{it.product_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">SKU: {it.sku}</div>
                  </div>

                  <div className="col-span-2 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {it.quantity} {it.unit_of_measure}
                  </div>

                  <div className="col-span-2 text-center font-mono text-slate-500">
                    {it.received_quantity || 0}
                  </div>

                  <div className="col-span-3 flex justify-end">
                    <input
                      type="number"
                      min="0"
                      max={it.quantity}
                      value={receivedMap[it.id] ?? 0}
                      onChange={(e) => handleQtyChange(it.id, Number(e.target.value))}
                      className="w-24 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify & Receive Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
