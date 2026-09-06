import {
  Boxes,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Search,
  ClipboardList,
  ArrowRight,
  Package,
} from 'lucide-react';
import { DashboardData } from '../../types';

interface EmployeeDashboardProps {
  data: DashboardData | null;
  onNavigate: (path: string) => void;
  onOpenCreateRequest: () => void;
  onOpenSearch: () => void;
}

export function EmployeeDashboard({
  data,
  onNavigate,
  onOpenCreateRequest,
  onOpenSearch,
}: EmployeeDashboardProps) {
  const metrics = data?.metrics || {
    availableProducts: 0,
    myPendingRequests: 0,
    myApprovedRequests: 0,
    myRejectedRequests: 0,
  };

  const statCards = [
    {
      title: 'Available Inventory Catalog',
      value: `${metrics.availableProducts || 0} items`,
      sub: 'Ready for requisition',
      icon: Boxes,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
      action: () => onNavigate('/employee/inventory'),
      actionLabel: 'Browse catalog',
    },
    {
      title: 'My Pending Requisitions',
      value: `${metrics.myPendingRequests || 0}`,
      sub: 'Under manager review',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
      action: () => onNavigate('/employee/my-requests?status=Pending'),
      actionLabel: 'Track pending',
    },
    {
      title: 'Approved Requisitions',
      value: `${metrics.myApprovedRequests || 0}`,
      sub: 'Approved / Ready for fulfillment',
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      action: () => onNavigate('/employee/my-requests?status=Approved'),
      actionLabel: 'View approved',
    },
    {
      title: 'Rejected Requisitions',
      value: `${metrics.myRejectedRequests || 0}`,
      sub: 'See manager comments',
      icon: XCircle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
      action: () => onNavigate('/employee/my-requests?status=Rejected'),
      actionLabel: 'Review feedback',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Employee Greeting & Action Cards */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Operations Requisition Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check product stock availability and request equipment, supplies, or warehouse stock.
          </p>
        </div>
        <button
          onClick={onOpenCreateRequest}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Stock Request</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onOpenCreateRequest}
          className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Submit Stock Request
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Order materials or warehouse parts required for your assigned duties.
          </p>
        </button>

        <button
          onClick={onOpenSearch}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Instant Inventory Search
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quickly lookup part specifications, serial numbers, and live warehouse locations.
          </p>
        </button>

        <button
          onClick={() => onNavigate('/employee/my-requests')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-500/20">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            View My Requisition History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track manager approval status and inventory dispatch progress.
          </p>
        </button>
      </div>

      {/* Recent My Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span>My Recent Requisitions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Status updates on your submitted requests</p>
          </div>
          <button
            onClick={() => onNavigate('/employee/my-requests')}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            All Requisitions
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {(!data?.myRecentRequests || data.myRecentRequests.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">You haven't submitted any requisitions yet.</div>
          ) : (
            data.myRecentRequests.map((req) => {
              const statusBadges = {
                Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
                Approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400',
                Fulfilled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
                Rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400',
                Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              };

              return (
                <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{req.product_name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({req.request_code})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Quantity: <span className="font-semibold">{req.requested_quantity} {req.unit_of_measure}</span> • Reason: "{req.reason}"
                    </div>
                    {req.comments && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                        Manager note: "{req.comments}"
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadges[req.status] || statusBadges.Pending}`}>
                      {req.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
