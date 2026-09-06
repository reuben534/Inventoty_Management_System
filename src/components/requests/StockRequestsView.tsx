import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock,
  MessageSquare,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { StockRequest, RequestStatus, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface StockRequestsViewProps {
  onOpenCreateRequest: () => void;
  initialStatusFilter?: string;
}

export function StockRequestsView({
  onOpenCreateRequest,
  initialStatusFilter,
}: StockRequestsViewProps) {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { success, error } = useToast();

  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || '');

  // Reject modal state
  const [rejectingRequest, setRejectingRequest] = useState<StockRequest | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch requisitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req: StockRequest) => {
    if (req.employee_id === user?.id) {
      error('Conflict of interest: You cannot approve your own requisition.');
      return;
    }

    setActionLoading(true);
    try {
      await api.reviewRequest(req.id, { status: 'Approved', comments: 'Approved by management' });
      success(`Request ${req.request_code} approved.`);
      fetchRequests();
    } catch (err: any) {
      error(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    if (rejectingRequest.employee_id === user?.id) {
      error('You cannot review your own requisition.');
      return;
    }

    setActionLoading(true);
    try {
      await api.reviewRequest(rejectingRequest.id, {
        status: 'Rejected',
        comments: rejectComment.trim() || 'Request rejected by management',
      });
      success(`Request ${rejectingRequest.request_code} marked as Rejected.`);
      setRejectingRequest(null);
      setRejectComment('');
      fetchRequests();
    } catch (err: any) {
      error(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async (req: StockRequest) => {
    setActionLoading(true);
    try {
      await api.fulfillRequest(req.id);
      success(`Requisition ${req.request_code} fulfilled: stock deducted and dispatch movement logged.`);
      fetchRequests();
    } catch (err: any) {
      error(err.message || 'Failed to fulfill request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!statusFilter) return true;
    return r.status === statusFilter;
  });

  const canReview = role === 'admin' || role === 'manager';

  const statusBadges: Record<RequestStatus, { badge: string; icon: any }> = {
    Pending: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400', icon: Clock },
    Approved: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400', icon: CheckCircle2 },
    Fulfilled: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400', icon: PackageCheck },
    Rejected: { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400', icon: XCircle },
    Cancelled: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Internal Stock Requisitions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {role === 'employee'
              ? 'Track your material requests, review approvals, and verify dispatch'
              : 'Review staff allocation requests, verify inventory quotas, and dispatch parts'}
          </p>
        </div>

        <button
          onClick={onOpenCreateRequest}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Request</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['', 'Pending', 'Approved', 'Fulfilled', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {status === '' ? 'All Requisitions' : status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Code / Date</th>
                <th className="px-4 py-3">Employee / Dept</th>
                <th className="px-4 py-3">Requested Product</th>
                <th className="px-4 py-3">Req Qty</th>
                <th className="px-4 py-3">Stock Available</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason / Remarks</th>
                {canReview && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No requisitions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const badgeInfo = statusBadges[r.status] || statusBadges.Pending;
                  const BadgeIcon = badgeInfo.icon;
                  const isSelfRequest = r.employee_id === user?.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      {/* Code / Date */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{r.request_code}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.employee_name}
                          {isSelfRequest && <span className="ml-1 text-[10px] text-blue-500 font-normal">(You)</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{r.department}</div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{r.product_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">SKU: {r.sku}</div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {r.requested_quantity} {r.unit_of_measure}
                      </td>

                      {/* Stock Available */}
                      <td className="px-4 py-3 font-mono">
                        <span
                          className={
                            (r.current_stock || 0) < r.requested_quantity
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-600 dark:text-slate-300'
                          }
                        >
                          {r.current_stock !== undefined ? `${r.current_stock} in stock` : 'Checking...'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badgeInfo.badge}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{r.status}</span>
                        </span>
                      </td>

                      {/* Reason & Comments */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">
                        <div className="truncate" title={r.reason}>
                          "{r.reason}"
                        </div>
                        {r.comments && (
                          <div className="text-[11px] text-slate-400 italic truncate" title={r.comments}>
                            Note: {r.comments}
                          </div>
                        )}
                      </td>

                      {/* Actions (Admin & Manager) */}
                      {canReview && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(r)}
                                  disabled={actionLoading || isSelfRequest}
                                  className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors"
                                  title={isSelfRequest ? 'Cannot approve own request' : 'Approve Requisition'}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingRequest(r);
                                    setRejectComment('');
                                  }}
                                  disabled={actionLoading || isSelfRequest}
                                  className="px-2.5 py-1 text-xs font-semibold rounded border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
                                  title={isSelfRequest ? 'Cannot review own request' : 'Reject Requisition'}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {r.status === 'Approved' && (
                              <button
                                onClick={() => handleFulfill(r)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors"
                                title="Fulfill & Deduct Stock"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Fulfill</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal with Comments */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Reject Requisition</h3>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Rejecting request <strong>{rejectingRequest.request_code}</strong> for {rejectingRequest.product_name} (Requested by {rejectingRequest.employee_name}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection (Visible to Employee)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="e.g. Current stock reserved for priority project; please re-request next week or use alternate SKU..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
