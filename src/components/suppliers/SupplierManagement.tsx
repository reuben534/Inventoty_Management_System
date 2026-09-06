import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Eye, Mail, Phone, MapPin, X, Loader2, Package, ShoppingCart } from 'lucide-react';
import { Supplier, Product, PurchaseOrder, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatZAR } from '../../utils/formatters';

export function SupplierManagement() {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { success, error } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('USA');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [supplierPOs, setSupplierPOs] = useState<PurchaseOrder[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers();
      setSuppliers(res.suppliers || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry('USA');
    setNotes('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setCompanyName(s.company_name);
    setContactPerson(s.contact_person || '');
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setCity(s.city || '');
    setCountry(s.country || 'USA');
    setNotes(s.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = async (s: Supplier) => {
    setDetailSupplier(s);
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await api.getSupplier(s.id);
      setSupplierProducts(res.products || []);
      setSupplierPOs(res.purchaseHistory || []);
    } catch (err: any) {
      error(err.message || 'Failed to load supplier details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      error('Company name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Supplier> = {
        company_name: companyName.trim(),
        contact_person: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        notes: notes.trim(),
      };

      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, payload);
        success('Supplier details updated.');
      } else {
        await api.createSupplier(payload);
        success('New vendor partner registered.');
      }
      setIsEditModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      error(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const canManage = role === 'admin' || role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vendor & Supplier Network</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registered procurement partners, supplier contracts, and contact directories
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Supplier</span>
          </button>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Supplier Code</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Contact Info</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Cataloged Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No suppliers registered.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {s.supplier_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{s.company_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.contact_person}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.city}, {s.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{s.product_count || 0} products</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="View Products & Orders"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Register New Vendor'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Industrial Parts Corp."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Sales Representative"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@vendor.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chicago, IL"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="USA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address or logistics depot"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Procurement Notes & Terms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms: Net 30, lead time 5 days..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSupplier ? 'Save Changes' : 'Register Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Detail Modal */}
      {isDetailModalOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{detailSupplier.company_name}</h3>
                  <div className="text-xs text-slate-400 font-mono">Code: {detailSupplier.supplier_code}</div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
              {/* Supplier Info Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400">Contact:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailSupplier.contact_person}</div>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailSupplier.email}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailSupplier.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400">Address:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailSupplier.address}, {detailSupplier.city}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Notes / Terms:</span>
                  <div className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{detailSupplier.notes || 'No notes'}</div>
                </div>
              </div>

              {/* Products Supplied */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Catalog Products ({supplierProducts.length})</span>
                </h4>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                  {supplierProducts.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">No products mapped to this supplier.</div>
                  ) : (
                    supplierProducts.map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                          <span className="text-slate-400 ml-2 font-mono">({p.sku})</span>
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          Cost: {formatZAR(p.cost_price)} • In Stock: {p.quantity} {p.unit_of_measure}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Purchase Orders History */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-500" />
                  <span>Purchase Orders ({supplierPOs.length})</span>
                </h4>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                  {supplierPOs.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">No purchase orders created for this supplier yet.</div>
                  ) : (
                    supplierPOs.map((po) => (
                      <div key={po.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{po.po_number}</span>
                          <span className="text-slate-400 ml-2">{new Date(po.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatZAR(po.total_amount)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {po.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
              <button
                onClick={() => setIsDetailModalOpen(false)}
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
