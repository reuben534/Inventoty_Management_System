import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Sliders,
  Edit2,
  Trash2,
  Eye,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Boxes,
} from 'lucide-react';
import { Product, Category, Warehouse, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatZAR } from '../../utils/formatters';

interface ProductCatalogProps {
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenDetailProduct: (product: Product) => void;
  onOpenAdjustStock: (product: Product) => void;
  onOpenCreateRequestForProduct: (product: Product) => void;
  onConfirmDelete: (product: Product) => void;
  initialFilter?: { stock_status?: string };
}

export function ProductCatalog({
  onOpenCreateProduct,
  onOpenEditProduct,
  onOpenDetailProduct,
  onOpenAdjustStock,
  onOpenCreateRequestForProduct,
  onConfirmDelete,
  initialFilter,
}: ProductCatalogProps) {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';
  const { error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<string>(initialFilter?.stock_status || '');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search,
        category_id: selectedCategory,
        warehouse_id: selectedWarehouse,
        stock_status: stockStatus,
        page,
        limit: 10,
        sort_by: sortBy,
        order: sortOrder,
      });
      setProducts(res.products);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      error(err.message || 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories || []));
    api.getWarehouses().then((res) => setWarehouses(res.warehouses || []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedWarehouse, stockStatus, sortBy, sortOrder, page]);

  const canManageProducts = role === 'admin' || role === 'manager';
  const canDeleteProducts = role === 'admin';
  const canAdjustStock = role === 'admin' || role === 'manager';

  const getStockStatusBadge = (p: Product) => {
    if (p.quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (p.quantity <= p.reorder_level) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>In Stock</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Product Inventory Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {totalCount} SKU items across company storage locations
          </p>
        </div>

        {canManageProducts && (
          <button
            onClick={onOpenCreateProduct}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name, SKU, or brand..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock Alerts</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Status</th>
                {(role === 'admin' || role === 'manager') && <th className="px-4 py-3">Pricing (Cost/Sell)</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading inventory items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Product Name & Image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-900"
                        />
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenDetailProduct(p)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left truncate block max-w-xs"
                          >
                            {p.name}
                          </button>
                          <span className="text-[11px] text-slate-400">{p.brand}</span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {p.sku}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 font-medium">
                        {p.category_name}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.warehouse_name}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.quantity} {p.unit_of_measure}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reorder at: {p.reorder_level}
                      </div>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="px-4 py-3">{getStockStatusBadge(p)}</td>

                    {/* Pricing */}
                    {(role === 'admin' || role === 'manager') && (
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                        <div>
                          <span className="text-slate-400 text-[10px]">Cost:</span> {formatZAR(p.cost_price)}
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Sell:</span> {formatZAR(p.selling_price)}
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenDetailProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Adjust Stock Button (Admin & Manager) */}
                        {canAdjustStock && (
                          <button
                            onClick={() => onOpenAdjustStock(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Adjust Stock"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                        )}

                        {/* Employee Requisition Shortcut */}
                        {role === 'employee' && (
                          <button
                            onClick={() => onOpenCreateRequestForProduct(p)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                            title="Request Stock"
                          >
                            <Send className="w-3 h-3" />
                            <span>Request</span>
                          </button>
                        )}

                        {/* Edit Product (Admin & Manager) */}
                        {canManageProducts && (
                          <button
                            onClick={() => onOpenEditProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Product (Admin only) */}
                        {canDeleteProducts && (
                          <button
                            onClick={() => onConfirmDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Delete / Archive Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages || 1} ({totalCount} total items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
