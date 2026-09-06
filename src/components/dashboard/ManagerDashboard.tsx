import {
  Boxes,
  AlertTriangle,
  Clock,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Warehouse,
} from 'lucide-react';
import { DashboardData } from '../../types';

interface ManagerDashboardProps {
  data: DashboardData | null;
  onNavigate: (path: string) => void;
  onOpenAdjustModal: (productId?: number) => void;
  onReviewRequest?: (requestId: number, status: 'Approved' | 'Rejected') => void;
}

export function ManagerDashboard({
  data,
  onNavigate,
  onOpenAdjustModal,
}: ManagerDashboardProps) {
  const metrics = data?.metrics || {
    totalProducts: 0,
    availableStock: 0,
    lowStockItemsCount: 0,
    pendingEmployeeRequestsCount: 0,
    pendingPurchaseRequestsCount: 0,
  };

  const statCards = [
    {
      title: 'Catalog Products',
      value: `${metrics.totalProducts}`,
      sub: 'Managed warehouse inventory',
      icon: Boxes,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
      action: () => onNavigate('/manager/inventory'),
      actionLabel: 'Browse catalog',
    },
    {
      title: 'Available Stock Units',
      value: `${(metrics.availableStock || 0).toLocaleString()}`,
      sub: 'Total operational physical stock',
      icon: Warehouse,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      action: () => onNavigate('/manager/inventory'),
      actionLabel: 'Check warehouse counts',
    },
    {
      title: 'Low Stock Alerts',
      value: `${metrics.lowStockItemsCount || 0}`,
      sub: 'Needs replenishment soon',
      icon: AlertTriangle,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
      action: () => onNavigate('/manager/inventory?stock_status=Low+Stock'),
      actionLabel: 'View low inventory',
    },
    {
      title: 'Pending Staff Requisitions',
      value: `${metrics.pendingEmployeeRequestsCount || 0}`,
      sub: 'Awaiting your management sign-off',
      icon: Clock,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
      action: () => onNavigate('/manager/requests'),
      actionLabel: 'Review requests',
    },
    {
      title: 'Pending Purchase Orders',
      value: `${metrics.pendingPurchaseRequestsCount || 0}`,
      sub: 'Supplier procurement tracking',
      icon: ShoppingCart,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
      action: () => onNavigate('/manager/purchase-orders'),
      actionLabel: 'PO management',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Warehouse & Inventory Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage daily stock reconciliations, approve staff allocations, and oversee incoming shipments.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onOpenAdjustModal()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => onNavigate('/manager/requests')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Requisitions</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-lg border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                  {card.value}
                </div>
                {card.sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.sub}</div>}
              </div>

              <button
                onClick={card.action}
                className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline group"
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Pending Requisitions Queue & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Employee Requests Queue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Pending Employee Requisitions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Awaiting management approval or fulfillment</p>
            </div>
            <button
              onClick={() => onNavigate('/manager/requests')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Process All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {(!data?.pendingEmployeeRequests || data.pendingEmployeeRequests.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No pending staff requisitions at this time.</div>
            ) : (
              data.pendingEmployeeRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{req.product_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                        {req.requested_quantity} {req.unit_of_measure}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      By {req.employee_name} ({req.department}) • Reason: "{req.reason}"
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('/manager/requests')}
                    className="shrink-0 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold transition-colors"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Immediate Reorder Warnings</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inventory levels requiring replenishment</p>
            </div>
            <button
              onClick={() => onNavigate('/manager/purchase-orders')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Create PO
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {(!data?.lowStockItems || data.lowStockItems.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">All managed items are sufficiently stocked.</div>
            ) : (
              data.lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: {item.sku} • {item.warehouse_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.quantity === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {item.quantity} / {item.reorder_level} {item.unit_of_measure}
                    </span>
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
