import { useState, useEffect } from 'react';
import { ArrowLeftRight, Download, ArrowDownLeft, ArrowUpRight, Sliders, RotateCcw, GitCompare, Filter } from 'lucide-react';
import { StockMovement, MovementType } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function StockMovementsList() {
  const { error } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.getMovements({ movement_type: typeFilter });
      setMovements(res.movements || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [typeFilter]);

  const handleExportCSV = () => {
    if (movements.length === 0) return;
    const headers = ['Transaction Code', 'Date', 'Product', 'SKU', 'Type', 'Previous Qty', 'New Qty', 'Delta', 'User', 'Location', 'Reason'];
    const rows = movements.map((m) => [
      m.transaction_code,
      new Date(m.created_at).toISOString(),
      `"${m.product_name || ''}"`,
      m.sku || '',
      m.movement_type,
      m.previous_quantity,
      m.new_quantity,
      m.quantity,
      `"${m.user_name || ''}"`,
      `"${m.source_location || ''}"`,
      `"${(m.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'Stock In':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Stock In</span>
          </span>
        );
      case 'Stock Out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>Stock Out</span>
          </span>
        );
      case 'Transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
            <GitCompare className="w-3 h-3" />
            <span>Transfer</span>
          </span>
        );
      case 'Return':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">
            <RotateCcw className="w-3 h-3" />
            <span>Return</span>
          </span>
        );
      case 'Stock Adjustment':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
            <Sliders className="w-3 h-3" />
            <span>Adjustment</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Stock Movement Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable audit trail of all warehouse stock changes, inbound receipts, and staff allocations
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={movements.length === 0}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['', 'Stock In', 'Stock Out', 'Stock Adjustment', 'Transfer', 'Return'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
              typeFilter === type
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {type === '' ? 'All Movements' : type}
          </button>
        ))}
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Code / Date</th>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity Delta</th>
                <th className="px-4 py-3">Audit Transition</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading stock transactions...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No stock movements found matching criteria.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const delta = m.new_quantity - m.previous_quantity;
                  const isPositive = delta > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">
                          {m.transaction_code}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{m.product_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">SKU: {m.sku}</div>
                      </td>

                      <td className="px-4 py-3">{getMovementBadge(m.movement_type)}</td>

                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'}>
                          {isPositive ? `+${delta}` : delta} {m.unit_of_measure}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {m.previous_quantity} → {m.new_quantity}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {m.source_location || 'Warehouse'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{m.user_name}</div>
                        <div className="text-[10px] uppercase text-slate-400">{m.user_role}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={m.reason}>
                        "{m.reason}"
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
