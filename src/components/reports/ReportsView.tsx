import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Banknote,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatZAR } from '../../utils/formatters';

export function ReportsView() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getDashboard()
      .then((res) => {
        setData(res);
      })
      .catch((err) => error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalValuation = data?.metrics?.totalInventoryValue || 0;
  const totalStockQuantity = data?.metrics?.totalStockQuantity || 0;
  const categoryBreakdown = data?.categoryStats || [];
  const warehouseBreakdown = data?.warehouseStats || [];
  const lowStockProducts = data?.lowStockItems || [];

  const handleExportCSV = () => {
    if (lowStockProducts.length === 0) return;
    const headers = ['SKU', 'Product Name', 'Warehouse', 'Current Stock', 'Reorder Level', 'Unit of Measure'];
    const rows = lowStockProducts.map((p: any) => [
      p.sku,
      `"${p.name}"`,
      `"${p.warehouse_name || ''}"`,
      p.quantity,
      p.reorder_level,
      p.unit_of_measure,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_low_stock_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Intelligence & Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Valuation metrics, capital allocation breakdowns, and replenishment alerts
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={lowStockProducts.length === 0}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Reorder Alert CSV</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {formatZAR(totalValuation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cost valuation basis across all locations</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Stock Count</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {(data?.totalQuantity || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Physical units held across network</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reorder Critical Items</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {lowStockProducts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Items at or below safety buffer</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Facilities</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {warehouseBreakdown.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Regional depots storing goods</div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Valuation by Product Category</span>
          </h3>

          <div className="space-y-4 text-xs">
            {categoryBreakdown.map((cat: any, idx: number) => {
              const val = Number(cat.total_value || 0);
              const pct = totalValuation > 0 ? (val / totalValuation) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {cat.product_count || 0} items • {cat.total_qty || 0} total units
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Valuation by Storage Facility</span>
          </h3>

          <div className="space-y-4 text-xs">
            {warehouseBreakdown.map((wh: any, idx: number) => {
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{wh.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {wh.total_stock || 0} units
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {wh.product_count || 0} unique SKUs cataloged
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Critical Reorder Items Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Replenishment Priority Action Queue</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5">Product Name</th>
                <th className="px-3 py-2.5">Warehouse</th>
                <th className="px-3 py-2.5">Current Stock</th>
                <th className="px-3 py-2.5">Reorder Point</th>
                <th className="px-3 py-2.5">Deficit Units</th>
                <th className="px-3 py-2.5 text-right">Est. Replenish Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No critical stock deficits detected. All inventory healthy!
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((p: any) => {
                  const deficit = Math.max(0, p.reorder_level - p.quantity);
                  const replenishCost = deficit * p.cost_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">{p.sku}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{p.warehouse_name}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {p.quantity} {p.unit_of_measure}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                        {p.reorder_level} {p.unit_of_measure}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-amber-600">
                        +{deficit} {p.unit_of_measure}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatZAR(replenishCost)}
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
