import { useState, useEffect } from 'react';
import { X, Package, ArrowLeftRight, Banknote, Warehouse, Truck, History } from 'lucide-react';
import { Product, StockMovement } from '../../types';
import { api } from '../../services/api';
import { formatZAR } from '../../utils/formatters';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onOpenAdjustStock?: (product: Product) => void;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onOpenAdjustStock,
}: ProductDetailModalProps) {
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      api
        .getProduct(product.id)
        .then((res) => {
          setHistory(res.history || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const margin = product.selling_price - product.cost_price;
  const marginPct = product.cost_price > 0 ? (margin / product.cost_price) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{product.name}</h3>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                SKU: {product.sku} • {product.brand}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info Card */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300'}
              alt={product.name}
              className="w-32 h-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-900"
            />
            <div className="flex-1 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description || 'No detailed specifications recorded for this inventory item.'}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-400">Category</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{product.category_name}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-400">Location</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{product.warehouse_name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Thresholds Metric Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Stock</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {product.quantity} <span className="text-xs font-normal text-slate-400">{product.unit_of_measure}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reorder Level</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {product.reorder_level} <span className="text-xs font-normal text-slate-400">{product.unit_of_measure}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Min Stock</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                {product.min_stock} <span className="text-xs font-normal text-slate-400">{product.unit_of_measure}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Max Stock</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                {product.max_stock} <span className="text-xs font-normal text-slate-400">{product.unit_of_measure}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Valuation Margins */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              <span>Valuation & Financial Margins (ZAR)</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Unit Cost:</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatZAR(product.cost_price)}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Selling / Allocation Price:</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatZAR(product.selling_price)}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Margin:</span>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +{formatZAR(margin)} ({marginPct.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History Log */}
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Recent Stock Movements for this SKU</span>
              </div>
              <span className="text-[11px] text-slate-400">{history.length} records</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No recorded movements yet for this item.</div>
              ) : (
                history.map((m) => (
                  <div key={m.id} className="p-3 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{m.movement_type}</span>
                        <span className="text-[10px] font-mono text-slate-400">({m.transaction_code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        By {m.user_name} • Reason: "{m.reason}"
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {m.previous_quantity} → {m.new_quantity} {product.unit_of_measure}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Close
          </button>
          {onOpenAdjustStock && (
            <button
              onClick={() => {
                onClose();
                onOpenAdjustStock(product);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Stock In / Out / Adjust</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
