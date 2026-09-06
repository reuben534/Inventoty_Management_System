import React, { useState, useEffect } from 'react';
import { X, Package, Wand2, Loader2 } from 'lucide-react';
import { Product, Category, Supplier, Warehouse } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved: () => void;
}

export function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
}: ProductModalProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Form fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | number | ''>('');
  const [brand, setBrand] = useState('');
  const [supplierId, setSupplierId] = useState<string | number | ''>('');
  const [warehouseId, setWarehouseId] = useState<string | number | ''>('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('units');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);
  const [quantity, setQuantity] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(10);
  const [maxStock, setMaxStock] = useState<number | ''>(100);
  const [reorderLevel, setReorderLevel] = useState<number | ''>(20);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'discontinued'>('active');

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then((r) => setCategories(r.categories || []));
      api.getSuppliers().then((r) => setSuppliers(r.suppliers || []));
      api.getWarehouses().then((r) => setWarehouses(r.warehouses || []));

      if (productToEdit) {
        setSku(productToEdit.sku);
        setName(productToEdit.name);
        setDescription(productToEdit.description || '');
        setCategoryId(productToEdit.category_id || '');
        setBrand(productToEdit.brand || '');
        setSupplierId(productToEdit.supplier_id || '');
        setWarehouseId(productToEdit.warehouse_id || '');
        setUnitOfMeasure(productToEdit.unit_of_measure || 'units');
        setCostPrice(productToEdit.cost_price);
        setSellingPrice(productToEdit.selling_price);
        setQuantity(productToEdit.quantity);
        setMinStock(productToEdit.min_stock);
        setMaxStock(productToEdit.max_stock);
        setReorderLevel(productToEdit.reorder_level);
        setImageUrl(productToEdit.image_url || '');
        setStatus(productToEdit.status || 'active');
      } else {
        // Defaults for new product
        setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
        setName('');
        setDescription('');
        setCategoryId('');
        setBrand('');
        setSupplierId('');
        setWarehouseId('');
        setUnitOfMeasure('units');
        setCostPrice(0);
        setSellingPrice(0);
        setQuantity(0);
        setMinStock(10);
        setMaxStock(150);
        setReorderLevel(25);
        setImageUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300');
        setStatus('active');
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !categoryId || !warehouseId) {
      error('Please complete all required fields (SKU, Name, Category, Warehouse).');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Product> = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim(),
        category_id: categoryId,
        brand: brand.trim(),
        supplier_id: supplierId || undefined,
        warehouse_id: warehouseId,
        unit_of_measure: unitOfMeasure,
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        quantity: Number(quantity) || 0,
        min_stock: Number(minStock) || 0,
        max_stock: Number(maxStock) || 100,
        reorder_level: Number(reorderLevel) || 10,
        image_url: imageUrl.trim(),
        status,
      };

      if (productToEdit) {
        await api.updateProduct(productToEdit.id, payload);
        success('Product successfully updated.');
      } else {
        await api.createProduct(payload);
        success('Product successfully added to catalog.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {productToEdit ? 'Edit Product Item' : 'Create New Product'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Keeping Unit (SKU) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="SKU-1001"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Generate Unique SKU"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Barcode Scanner 2D"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, model notes, intended usage..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category, Brand, Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="LogiTech / Dell / etc."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Warehouse & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Warehouse *
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.warehouse_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measure
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="units">units</option>
                <option value="pcs">pcs</option>
                <option value="boxes">boxes</option>
                <option value="rolls">rolls</option>
                <option value="pallets">pallets</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
              </select>
            </div>
          </div>

          {/* Pricing & Initial Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost Price (R - ZAR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling / Transfer Price (R - ZAR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Stock Count
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reorder Level (Alert)
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Image URL & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Status
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
