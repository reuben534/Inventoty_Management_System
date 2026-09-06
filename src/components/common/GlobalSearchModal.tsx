import { useState, useEffect, useRef } from 'react';
import { Search, Package, Truck, ClipboardList, ShoppingCart, ArrowRight, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Supplier, StockRequest, PurchaseOrder } from '../../types';
import { formatZAR } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (productId: number) => void;
  onNavigate: (path: string) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: Product[];
    suppliers: Supplier[];
    requests: StockRequest[];
    purchaseOrders: PurchaseOrder[];
  }>({ products: [], suppliers: [], requests: [], purchaseOrders: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ products: [], suppliers: [], requests: [], purchaseOrders: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], suppliers: [], requests: [], purchaseOrders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasAnyResults =
    results.products.length > 0 ||
    results.suppliers.length > 0 ||
    results.requests.length > 0 ||
    results.purchaseOrders.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, SKU, supplier, request code, PO number..."
            className="flex-1 bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-12 text-center text-sm text-slate-400">
              Type to search across the inventory catalog, active purchase orders, and requisition records.
            </div>
          )}

          {query.trim() && !loading && !hasAnyResults && (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>Products ({results.products.length})</span>
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onNavigate(`/admin/products`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{p.sku}</span>
                        <span>•</span>
                        <span>Stock: {p.quantity} {p.unit_of_measure}</span>
                        <span>•</span>
                        <span>{p.category_name}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {results.suppliers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Suppliers ({results.suppliers.length})</span>
              </div>
              <div className="space-y-1">
                {results.suppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onClose();
                      onNavigate(`/admin/suppliers`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{s.company_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Code: {s.supplier_code} • Contact: {s.contact_person}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Requisitions */}
          {results.requests.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                <span>Requisitions ({results.requests.length})</span>
              </div>
              <div className="space-y-1">
                {results.requests.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onClose();
                      onNavigate(`/admin/requests`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{r.request_code}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.requested_quantity}x {r.product_name} • Status: {r.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Orders */}
          {results.purchaseOrders.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-purple-500" />
                <span>Purchase Orders ({results.purchaseOrders.length})</span>
              </div>
              <div className="space-y-1">
                {results.purchaseOrders.map((po) => (
                  <button
                    key={po.id}
                    onClick={() => {
                      onClose();
                      onNavigate(`/admin/purchase-orders`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{po.po_number}</div>
                      <div className="text-[11px] text-slate-500">
                        {po.supplier_name} • {formatZAR(po.total_amount)} • {po.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
