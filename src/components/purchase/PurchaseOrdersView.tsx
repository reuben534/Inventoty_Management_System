import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Eye,
  Loader2,
  X,
} from 'lucide-react';
import { PurchaseOrder, POStatus, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CreatePOModal } from './CreatePOModal';
import { ReceiveGoodsModal } from './ReceiveGoodsModal';
import { formatZAR } from '../../utils/formatters';

export function PurchaseOrdersView() {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { success, error } = useToast();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<any | null>(null);
  const [loadingPO, setLoadingPO] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseOrders();
      setOrders(res.orders || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: number, status: POStatus) => {
    try {
      await api.updatePOStatus(id, status);
      success(`Purchase order status updated to ${status}.`);
      fetchOrders();
    } catch (err: any) {
      error(err.message || 'Failed to update order status');
    }
  };

  const handleViewDetails = async (po: PurchaseOrder) => {
    setLoadingPO(true);
    try {
      const res = await api.getPurchaseOrder(po.id);
      setViewingPO(res);
    } catch (err: any) {
      error(err.message || 'Failed to load PO details');
    } finally {
      setLoadingPO(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!statusFilter) return true;
    return o.status === statusFilter;
  });

  const canCreate = role === 'admin' || role === 'manager';
  const isAdmin = role === 'admin';

  const statusBadges: Record<POStatus, { badge: string; icon: any }> = {
    Draft: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: FileText },
    'Pending Approval': { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400', icon: Clock },
    Approved: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400', icon: CheckCircle2 },
    Ordered: { badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400', icon: Truck },
    'Partially Received': { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400', icon: PackageCheck },
    Received: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400', icon: PackageCheck },
    Cancelled: { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Purchase Orders & Inbound Goods</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Vendor procurement contracts, financial authorizations, and warehouse receiving dock operations
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {status === '' ? 'All Orders' : status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">Destination Facility</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Expected Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Authorized By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders found matching filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const badgeInfo = statusBadges[po.status] || statusBadges.Draft;
                  const BadgeIcon = badgeInfo.icon;

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{po.po_number}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(po.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {po.supplier_name}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{po.warehouse_name}</td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatZAR(po.total_amount)}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                        {po.expected_delivery_date || 'N/A'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badgeInfo.badge}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{po.status}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {po.created_by_name || 'System'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(po)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Admin Approval */}
                          {isAdmin && po.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'Approved')}
                              className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white"
                              title="Authorize PO"
                            >
                              Approve
                            </button>
                          )}

                          {/* Dispatch to vendor */}
                          {canCreate && po.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'Ordered')}
                              className="px-2 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                              title="Mark Transmitted to Vendor"
                            >
                              Mark Ordered
                            </button>
                          )}

                          {/* Inbound Goods Receiving */}
                          {canCreate && (po.status === 'Ordered' || po.status === 'Partially Received') && (
                            <button
                              onClick={() => setReceivingPO(po)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                              title="Receive Goods at Dock"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      <CreatePOModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchOrders}
      />

      {/* Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={!!receivingPO}
        onClose={() => setReceivingPO(null)}
        purchaseOrder={receivingPO}
        onReceived={fetchOrders}
      />

      {/* View PO Detail Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">PO: {viewingPO.po_number}</h3>
                  <div className="text-xs text-slate-400">Created {new Date(viewingPO.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <button
                onClick={() => setViewingPO(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400">Supplier:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingPO.supplier_name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Warehouse Dock:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingPO.warehouse_name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Expected Delivery:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewingPO.expected_delivery_date || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="font-bold text-blue-600 mt-0.5">{viewingPO.status}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">PO Notes:</span>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">{viewingPO.notes || 'None'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Line Items</h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 font-bold text-slate-500 uppercase text-[10px]">
                    <div className="col-span-5">Product SKU</div>
                    <div className="col-span-2 text-center">Ordered</div>
                    <div className="col-span-2 text-center">Received</div>
                    <div className="col-span-3 text-right">Line Total</div>
                  </div>
                  {viewingPO.items?.map((it: any) => (
                    <div key={it.id} className="grid grid-cols-12 gap-2 p-3 items-center">
                      <div className="col-span-5">
                        <span className="font-bold text-slate-900 dark:text-white">{it.product_name}</span>
                        <span className="text-[11px] font-mono text-slate-400 ml-1.5">({it.sku})</span>
                      </div>
                      <div className="col-span-2 text-center font-mono">{it.quantity}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-emerald-600">
                        {it.received_quantity || 0}
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatZAR(it.quantity * it.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl flex justify-between items-center font-bold text-sm">
                <span>Total PO Valuation:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatZAR(viewingPO.total_amount)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
              <button
                onClick={() => setViewingPO(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
