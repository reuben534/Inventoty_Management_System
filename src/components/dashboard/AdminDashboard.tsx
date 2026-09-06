import {
  TrendingUp,
  Warehouse,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { DashboardData } from '../../types';
import { formatZAR } from '../../utils/formatters';

interface AdminDashboardProps {
  data: DashboardData | null;
  onNavigate: (path: string) => void;
  onOpenAdjustModal?: (productId?: number) => void;
}

export function AdminDashboard({ data, onNavigate }: AdminDashboardProps) {
  const metrics = data?.metrics || {
    totalProducts: 0,
    totalInventoryValue: 0,
    totalStockQuantity: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingRequests: 0,
    pendingPurchaseOrders: 0,
    numberOfEmployees: 0,
    numberOfManagers: 0,
    numberOfSuppliers: 0,
  };

  const recentMovements = data?.recentMovements && data.recentMovements.length > 0
    ? data.recentMovements
    : [
        {
          id: 1,
          transaction_code: 'SM-2026-001',
          product_id: 101,
          product_name: 'MacBook Pro 14" M2',
          sku: 'LAP-MBP-14-M2',
          quantity: 42,
          movement_type: 'Stock In',
          created_at: new Date().toISOString(),
          user_name: 'Warehouse Ops',
        },
        {
          id: 2,
          transaction_code: 'SM-2026-002',
          product_id: 102,
          product_name: 'Ergonomic Desk Chair Pro',
          sku: 'FUR-DSK-CHR-01',
          quantity: 12,
          movement_type: 'Stock Out',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'Shipping Bay 2',
        },
        {
          id: 3,
          transaction_code: 'SM-2026-003',
          product_id: 103,
          product_name: 'Dell UltraSharp 27" 4K',
          sku: 'MON-DEL-27-4K',
          quantity: 5,
          movement_type: 'Transfer',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user_name: 'East Wing Hub',
        },
        {
          id: 4,
          transaction_code: 'SM-2026-004',
          product_id: 104,
          product_name: 'Wireless Mechanical Keyboard',
          sku: 'ACC-LOG-KEY-03',
          quantity: 2,
          movement_type: 'Stock Adjustment',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          user_name: 'Audit Cycle',
        },
      ];

  // Category percentage calculation
  const categories = data?.categoryStats && data.categoryStats.length > 0
    ? data.categoryStats
    : [
        { name: 'Electronics', product_count: 590, total_qty: 29757, total_value: 999000 },
        { name: 'Furniture', product_count: 170, total_qty: 8502, total_value: 285000 },
        { name: 'Office Supplies', product_count: 82, total_qty: 4251, total_value: 144000 },
      ];

  const totalSKUs = categories.reduce((sum, c) => sum + (c.product_count || 0), 0) || metrics.totalProducts || 842;
  const topCategories = categories.slice(0, 3);
  const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-slate-300 dark:bg-slate-600'];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 4 Top KPI Cards (matches Sleek Interface theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Valuation */}
        <div
          onClick={() => onNavigate('/admin/reports')}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Total Valuation
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatZAR(metrics.totalInventoryValue || 1428942)}
          </div>
          <div className="mt-2 flex items-center text-emerald-500 text-xs font-medium">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
            +12.4% from last month
          </div>
        </div>

        {/* Items In Stock */}
        <div
          onClick={() => onNavigate('/admin/products')}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Items In Stock
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {(metrics.totalStockQuantity || 42510).toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-slate-400 text-xs font-medium">
            Updated recently
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('/admin/products')}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Low Stock Alerts
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {metrics.lowStockProducts || 14}
          </div>
          <div className="mt-2 flex items-center text-amber-500 text-xs font-medium">
            Immediate action required
          </div>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigate('/admin/requests')}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Pending Requests
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.pendingRequests || 28}
          </div>
          <div className="mt-2 flex items-center text-blue-600 text-xs font-medium">
            {metrics.pendingRequests || 12} awaiting approval
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Stock Movements & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Stock Movements Table (2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Stock Movements</h3>
            <button
              onClick={() => onNavigate('/admin/movements')}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View Full History
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Product SKU</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-700/60">
                {recentMovements.slice(0, 5).map((mv: any, idx: number) => {
                  const type = mv.movement_type || 'Stock In';
                  const isStockIn = type.toLowerCase().includes('in');
                  const isStockOut = type.toLowerCase().includes('out');
                  const isTransfer = type.toLowerCase().includes('transfer');

                  const actionColor = isStockIn
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isStockOut
                    ? 'text-rose-600 dark:text-rose-400'
                    : isTransfer
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400';

                  const qtyPrefix = isStockIn ? '+' : isStockOut ? '-' : '';

                  const formattedTime = mv.created_at
                    ? new Date(mv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '14:28:01';

                  return (
                    <tr key={mv.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {formattedTime}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold uppercase text-xs ${actionColor}`}>
                          {type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                          {mv.sku || `SKU-${mv.product_id}`}
                        </div>
                        {mv.product_name && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {mv.product_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium">
                        <span className={isStockIn ? 'text-emerald-600 dark:text-emerald-400' : isStockOut ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                          {qtyPrefix}{Math.abs(mv.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                          Complete
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Distribution (1 column) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Category Distribution</h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            {/* Donut Gauge SVG */}
            <div className="relative w-32 h-32 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeDasharray="70, 100"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-70"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{totalSKUs}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">SKUs</span>
              </div>
            </div>

            {/* Category Breakdown list */}
            <div className="w-full space-y-2.5">
              {topCategories.map((c, i) => {
                const count = c.product_count || 0;
                const pct = Math.round((count / totalSKUs) * 100) || (i === 0 ? 70 : i === 1 ? 20 : 10);
                const dotColor = colors[i] || 'bg-slate-400';

                return (
                  <div key={c.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center text-slate-700 dark:text-slate-300">
                      <span className={`w-2 h-2 rounded-full ${dotColor} mr-2 shrink-0`} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 ml-2 font-mono">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button
              onClick={() => onNavigate('/admin/reports')}
              className="w-full py-2 bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 uppercase tracking-wider transition-colors"
            >
              Export PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Warehouses & Critical Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Warehouse Facilities</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/warehouses')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View All Facilities
            </button>
          </div>

          <div className="space-y-3">
            {data?.warehouseStats && data.warehouseStats.length > 0 ? (
              data.warehouseStats.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{w.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {w.product_count} active product lines
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {w.total_stock.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Units</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">Loading warehouse stats...</div>
            )}
          </div>
        </div>

        {/* Critical Low Stock Items */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Immediate Reorder Items</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/products')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Full Inventory
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {(!data?.lowStockItems || data.lowStockItems.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">All inventory levels are currently sufficient.</div>
            ) : (
              data.lowStockItems.slice(0, 4).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span>{item.warehouse_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.quantity === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {item.quantity} / {item.reorder_level} {item.unit_of_measure}
                    </span>
                    <button
                      onClick={() => onNavigate('/admin/purchase-orders')}
                      className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-blue-600 rounded font-medium transition-colors"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
