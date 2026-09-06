import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  User,
  Category,
  Supplier,
  Warehouse,
  Product,
  StockMovement,
  StockRequest,
  PurchaseOrder,
  StockTransfer,
  Notification,
  AuditLog,
  SystemSetting,
} from './models/index.js';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRole,
  generateToken,
} from './auth.js';
import { createAuditLog, createNotification } from './db.js';

export const apiRouter = express.Router();

function getStockStatus(qty: number, reorderLevel: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

// ==========================================
// 1. AUTHENTICATION & DEMO ACCOUNTS
// ==========================================

// Get list of demo users for quick login testing
apiRouter.get('/auth/demo-users', async (_req, res) => {
  try {
    const users = await User.find({ status: 'active' }, 'name email role department avatar')
      .sort({ role: 1, _id: 1 })
      .lean();

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
      })),
      defaultPassword: 'Password123!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    });

    createAuditLog(user._id, user.name, user.role, 'USER_LOGIN', 'AUTH', `User logged in from web portal`, req.ip);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Profile
apiRouter.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
apiRouter.post('/auth/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 8);
    await user.save();

    createAuditLog(user._id, user.name, user.role, 'PASSWORD_CHANGE', 'AUTH', `User changed account password`, req.ip);

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password (Mock reset code flow)
apiRouter.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(404).json({ error: 'No account registered with this email address.' });
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    res.json({
      message: 'Reset instructions dispatched.',
      email: user.email,
      resetCode,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
apiRouter.post('/auth/reset-password', async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !resetCode || !newPassword) {
    res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 8);
    await user.save();

    createAuditLog(user._id, user.name, user.role, 'PASSWORD_RESET', 'AUTH', `Password reset via security code`, req.ip);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// ==========================================
// 2. DASHBOARDS
// ==========================================

apiRouter.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const products = await Product.find({ status: 'active' }).populate('warehouse_id', 'name').lean();

    const totalProducts = products.length;
    let totalInventoryValue = 0;
    let totalStockQuantity = 0;
    let availableProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    const lowStockItems: any[] = [];

    for (const p of products) {
      const qty = p.quantity || 0;
      const cost = p.cost_price || 0;
      totalStockQuantity += qty;
      totalInventoryValue += qty * cost;

      if (qty > 0) availableProducts++;
      if (qty <= 0) {
        outOfStockProducts++;
        lowStockItems.push({
          id: p._id.toString(),
          sku: p.sku,
          name: p.name,
          quantity: p.quantity,
          reorder_level: p.reorder_level,
          unit_of_measure: p.unit_of_measure,
          warehouse_name: (p.warehouse_id as any)?.name || 'Main Hub',
          stock_status: 'Out of Stock',
        });
      } else if (qty <= p.reorder_level) {
        lowStockProducts++;
        lowStockItems.push({
          id: p._id.toString(),
          sku: p.sku,
          name: p.name,
          quantity: p.quantity,
          reorder_level: p.reorder_level,
          unit_of_measure: p.unit_of_measure,
          warehouse_name: (p.warehouse_id as any)?.name || 'Main Hub',
          stock_status: 'Low Stock',
        });
      }
    }

    const pendingRequests = await StockRequest.countDocuments({ status: 'Pending' });
    const pendingPurchaseOrders = await PurchaseOrder.countDocuments({ status: { $in: ['Draft', 'Pending Approval'] } });
    const numberOfEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
    const numberOfManagers = await User.countDocuments({ role: 'manager', status: 'active' });
    const numberOfSuppliers = await Supplier.countDocuments({ status: 'active' });

    let myPendingRequests = 0;
    let myApprovedRequests = 0;
    let myRejectedRequests = 0;
    if (user.role === 'employee') {
      myPendingRequests = await StockRequest.countDocuments({ employee_id: user.id, status: 'Pending' });
      myApprovedRequests = await StockRequest.countDocuments({ employee_id: user.id, status: 'Approved' });
      myRejectedRequests = await StockRequest.countDocuments({ employee_id: user.id, status: 'Rejected' });
    }

    // Category breakdown
    const categories = await Category.find({ status: 'active' }).lean();
    const categoryStats = categories.map((cat) => {
      const catProds = products.filter((p) => String(p.category_id) === String(cat._id));
      const total_qty = catProds.reduce((sum, p) => sum + p.quantity, 0);
      const total_value = catProds.reduce((sum, p) => sum + p.quantity * p.cost_price, 0);
      return {
        name: cat.name,
        product_count: catProds.length,
        total_qty,
        total_value,
      };
    });

    // Warehouse breakdown
    const warehouses = await Warehouse.find({ status: 'active' }).lean();
    const warehouseStats = warehouses.map((wh) => {
      const whProds = products.filter((p) => String(p.warehouse_id?._id || p.warehouse_id) === String(wh._id));
      const total_stock = whProds.reduce((sum, p) => sum + p.quantity, 0);
      return {
        name: wh.name,
        product_count: whProds.length,
        total_stock,
      };
    });

    // Recent movements
    const movementsRaw = await StockMovement.find()
      .sort({ created_at: -1 })
      .limit(10)
      .populate('product_id', 'name sku unit_of_measure')
      .populate('user_id', 'name role')
      .lean();

    const recentMovements = movementsRaw.map((m: any) => ({
      id: m._id.toString(),
      transaction_code: m.transaction_code,
      product_id: m.product_id?._id?.toString() || m.product_id?.toString(),
      product_name: m.product_id?.name || 'Unknown Product',
      sku: m.product_id?.sku || '',
      unit_of_measure: m.product_id?.unit_of_measure || 'pcs',
      quantity: m.quantity,
      previous_quantity: m.previous_quantity,
      new_quantity: m.new_quantity,
      movement_type: m.movement_type,
      user_id: m.user_id?._id?.toString() || '',
      user_name: m.user_id?.name || 'System',
      user_role: m.user_id?.role || '',
      source_location: m.source_location,
      destination_location: m.destination_location,
      reason: m.reason,
      created_at: m.created_at?.toISOString?.() || String(m.created_at),
    }));

    // Recent Audit Logs
    const auditLogsRaw = await AuditLog.find().sort({ created_at: -1 }).limit(10).lean();
    const recentActivity = auditLogsRaw.map((a: any) => ({
      id: a._id.toString(),
      user_id: a.user_id?.toString() || null,
      user_name: a.user_name,
      user_role: a.user_role,
      action: a.action,
      module: a.module,
      description: a.description,
      ip_address: a.ip_address,
      created_at: a.created_at?.toISOString?.() || String(a.created_at),
    }));

    // Pending employee requests
    const pendingRequestsRaw = await StockRequest.find({ status: 'Pending' })
      .sort({ created_at: -1 })
      .limit(10)
      .populate('product_id', 'name sku unit_of_measure quantity')
      .populate('employee_id', 'name email department')
      .lean();

    const pendingEmployeeRequests = pendingRequestsRaw.map((r: any) => ({
      id: r._id.toString(),
      request_code: r.request_code,
      employee_id: r.employee_id?._id?.toString() || '',
      employee_name: r.employee_id?.name || 'Staff',
      employee_email: r.employee_id?.email || '',
      department: r.department,
      product_id: r.product_id?._id?.toString() || '',
      product_name: r.product_id?.name || '',
      sku: r.product_id?.sku || '',
      unit_of_measure: r.product_id?.unit_of_measure || 'pcs',
      current_stock: r.product_id?.quantity || 0,
      requested_quantity: r.requested_quantity,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at?.toISOString?.() || String(r.created_at),
    }));

    // My Recent Requests
    let myRecentRequests: any[] = [];
    if (user.role === 'employee') {
      const myReqsRaw = await StockRequest.find({ employee_id: user.id })
        .sort({ created_at: -1 })
        .limit(10)
        .populate('product_id', 'name sku unit_of_measure quantity')
        .populate('approved_by', 'name')
        .lean();

      myRecentRequests = myReqsRaw.map((r: any) => ({
        id: r._id.toString(),
        request_code: r.request_code,
        employee_id: user.id,
        department: r.department,
        product_id: r.product_id?._id?.toString() || '',
        product_name: r.product_id?.name || '',
        sku: r.product_id?.sku || '',
        unit_of_measure: r.product_id?.unit_of_measure || 'pcs',
        current_stock: r.product_id?.quantity || 0,
        requested_quantity: r.requested_quantity,
        reason: r.reason,
        status: r.status,
        approved_by_name: r.approved_by?.name || undefined,
        approval_date: r.approval_date || undefined,
        comments: r.comments || '',
        created_at: r.created_at?.toISOString?.() || String(r.created_at),
      }));
    }

    res.json({
      metrics: {
        totalProducts,
        totalInventoryValue,
        totalStockQuantity,
        availableStock: totalStockQuantity,
        availableProducts,
        lowStockProducts,
        outOfStockProducts,
        lowStockItemsCount: lowStockProducts + outOfStockProducts,
        pendingRequests,
        pendingEmployeeRequestsCount: pendingRequests,
        pendingPurchaseOrders,
        pendingPurchaseRequestsCount: pendingPurchaseOrders,
        numberOfEmployees,
        numberOfManagers,
        numberOfSuppliers,
        myPendingRequests,
        myApprovedRequests,
        myRejectedRequests,
      },
      categoryStats,
      warehouseStats,
      lowStockItems,
      recentMovements,
      recentActivity,
      pendingEmployeeRequests,
      myRecentRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. PRODUCTS & INVENTORY
// ==========================================

apiRouter.get('/products', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      category_id,
      warehouse_id,
      stock_status,
      sort_by = 'name',
      order = 'asc',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const queryFilter: any = { status: { $ne: 'discontinued' } };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      queryFilter.$or = [{ name: regex }, { sku: regex }, { brand: regex }];
    }

    if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
      queryFilter.category_id = category_id;
    }

    if (warehouse_id && mongoose.Types.ObjectId.isValid(warehouse_id)) {
      queryFilter.warehouse_id = warehouse_id;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOption: any = {};
    const sortField = ['name', 'sku', 'quantity', 'cost_price', 'selling_price', 'created_at'].includes(sort_by)
      ? sort_by
      : 'name';
    sortOption[sortField] = order === 'desc' ? -1 : 1;

    let allMatchingProducts = await Product.find(queryFilter)
      .populate('category_id', 'name')
      .populate('supplier_id', 'company_name')
      .populate('warehouse_id', 'name')
      .sort(sortOption)
      .lean();

    // In-memory stock status filter if needed (since it compares quantity to reorder_level)
    if (stock_status) {
      allMatchingProducts = allMatchingProducts.filter((p) => {
        const status = getStockStatus(p.quantity, p.reorder_level);
        return status === stock_status;
      });
    }

    const total = allMatchingProducts.length;
    const paginated = allMatchingProducts.slice(skip, skip + limitNum);

    const formatted = paginated.map((p: any) => ({
      id: p._id.toString(),
      sku: p.sku,
      name: p.name,
      description: p.description,
      category_id: p.category_id?._id?.toString() || p.category_id?.toString(),
      category_name: p.category_id?.name || '',
      brand: p.brand,
      supplier_id: p.supplier_id?._id?.toString() || p.supplier_id?.toString(),
      supplier_name: p.supplier_id?.company_name || '',
      warehouse_id: p.warehouse_id?._id?.toString() || p.warehouse_id?.toString(),
      warehouse_name: p.warehouse_id?.name || '',
      unit_of_measure: p.unit_of_measure,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      min_stock: p.min_stock,
      max_stock: p.max_stock,
      reorder_level: p.reorder_level,
      image_url: p.image_url,
      status: p.status,
      stock_status: getStockStatus(p.quantity, p.reorder_level),
      created_at: p.created_at?.toISOString?.() || String(p.created_at),
      updated_at: p.updated_at?.toISOString?.() || String(p.updated_at),
    }));

    res.json({
      products: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const p = await Product.findById(id)
      .populate('category_id', 'name')
      .populate('supplier_id', 'company_name')
      .populate('warehouse_id', 'name')
      .lean();

    if (!p) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const movementsRaw = await StockMovement.find({ product_id: id })
      .sort({ created_at: -1 })
      .limit(20)
      .populate('user_id', 'name role')
      .lean();

    const history = movementsRaw.map((m: any) => ({
      id: m._id.toString(),
      transaction_code: m.transaction_code,
      product_id: id,
      quantity: m.quantity,
      previous_quantity: m.previous_quantity,
      new_quantity: m.new_quantity,
      movement_type: m.movement_type,
      user_id: m.user_id?._id?.toString() || '',
      user_name: m.user_id?.name || 'System',
      user_role: m.user_id?.role || '',
      source_location: m.source_location,
      destination_location: m.destination_location,
      reason: m.reason,
      created_at: m.created_at?.toISOString?.() || String(m.created_at),
    }));

    const formattedProduct = {
      id: p._id.toString(),
      sku: p.sku,
      name: p.name,
      description: p.description,
      category_id: (p.category_id as any)?._id?.toString() || p.category_id?.toString(),
      category_name: (p.category_id as any)?.name || '',
      brand: p.brand,
      supplier_id: (p.supplier_id as any)?._id?.toString() || p.supplier_id?.toString(),
      supplier_name: (p.supplier_id as any)?.company_name || '',
      warehouse_id: (p.warehouse_id as any)?._id?.toString() || p.warehouse_id?.toString(),
      warehouse_name: (p.warehouse_id as any)?.name || '',
      unit_of_measure: p.unit_of_measure,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      min_stock: p.min_stock,
      max_stock: p.max_stock,
      reorder_level: p.reorder_level,
      image_url: p.image_url,
      status: p.status,
      stock_status: getStockStatus(p.quantity, p.reorder_level),
      created_at: p.created_at?.toISOString?.() || String(p.created_at),
    };

    res.json({ product: formattedProduct, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Product (Admin or Manager)
apiRouter.post('/products', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sku,
      name,
      description = '',
      category_id,
      brand = '',
      supplier_id,
      warehouse_id,
      unit_of_measure = 'pcs',
      cost_price = 0,
      selling_price = 0,
      quantity = 0,
      min_stock = 5,
      max_stock = 100,
      reorder_level = 15,
      image_url = '',
    } = req.body;

    if (!sku || !name || !category_id || !supplier_id || !warehouse_id) {
      res.status(400).json({ error: 'SKU, Name, Category, Supplier, and Warehouse are required.' });
      return;
    }

    const existing = await Product.findOne({ sku: sku.trim() });
    if (existing) {
      res.status(400).json({ error: `A product with SKU "${sku}" already exists.` });
      return;
    }

    const product = await Product.create({
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim(),
      category_id: new mongoose.Types.ObjectId(String(category_id)),
      brand: brand.trim(),
      supplier_id: new mongoose.Types.ObjectId(String(supplier_id)),
      warehouse_id: new mongoose.Types.ObjectId(String(warehouse_id)),
      unit_of_measure,
      cost_price: Number(cost_price) || 0,
      selling_price: Number(selling_price) || 0,
      quantity: Number(quantity) || 0,
      min_stock: Number(min_stock) || 5,
      max_stock: Number(max_stock) || 100,
      reorder_level: Number(reorder_level) || 15,
      image_url: image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
      status: 'active',
    });

    // Record initial stock movement if quantity > 0
    if (Number(quantity) > 0) {
      await StockMovement.create({
        transaction_code: `MOV-${Date.now().toString().slice(-6)}`,
        product_id: product._id,
        quantity: Number(quantity),
        previous_quantity: 0,
        new_quantity: Number(quantity),
        movement_type: 'Stock In',
        user_id: new mongoose.Types.ObjectId(req.user!.id),
        source_location: 'Initial Opening Inventory',
        destination_location: 'Warehouse Storage',
        reason: 'Catalog Item Creation with initial stock balance',
      });
    }

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'PRODUCT_CREATED',
      'INVENTORY',
      `Created product ${product.name} (SKU: ${product.sku})`
    );

    res.status(201).json({ id: product._id.toString(), message: 'Product created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Product (Admin or Manager)
apiRouter.put('/products/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const {
      name,
      description,
      category_id,
      brand,
      supplier_id,
      warehouse_id,
      unit_of_measure,
      cost_price,
      selling_price,
      min_stock,
      max_stock,
      reorder_level,
      image_url,
      status,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category_id && mongoose.Types.ObjectId.isValid(category_id)) product.category_id = new mongoose.Types.ObjectId(String(category_id));
    if (brand !== undefined) product.brand = brand.trim();
    if (supplier_id && mongoose.Types.ObjectId.isValid(supplier_id)) product.supplier_id = new mongoose.Types.ObjectId(String(supplier_id));
    if (warehouse_id && mongoose.Types.ObjectId.isValid(warehouse_id)) product.warehouse_id = new mongoose.Types.ObjectId(String(warehouse_id));
    if (unit_of_measure) product.unit_of_measure = unit_of_measure;
    if (cost_price !== undefined) product.cost_price = Number(cost_price);
    if (selling_price !== undefined) product.selling_price = Number(selling_price);
    if (min_stock !== undefined) product.min_stock = Number(min_stock);
    if (max_stock !== undefined) product.max_stock = Number(max_stock);
    if (reorder_level !== undefined) product.reorder_level = Number(reorder_level);
    if (image_url !== undefined) product.image_url = image_url;
    if (status) product.status = status;

    await product.save();

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'PRODUCT_UPDATED',
      'INVENTORY',
      `Updated product ${product.name} (${product.sku})`
    );

    res.json({ message: 'Product updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product (Admin only)
apiRouter.delete('/products/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Check if PO items exist
    const poCount = await PurchaseOrder.countDocuments({ 'items.product_id': id });
    if (poCount > 0) {
      res.status(400).json({ error: 'Cannot delete product referenced by existing purchase orders. Archive or discontinue instead.' });
      return;
    }

    // Check if open stock requests exist
    const reqCount = await StockRequest.countDocuments({ product_id: id, status: { $in: ['Pending', 'Approved'] } });
    if (reqCount > 0) {
      res.status(400).json({ error: 'Cannot delete product with pending or approved stock requisitions.' });
      return;
    }

    await Product.findByIdAndDelete(id);

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'PRODUCT_DELETED',
      'INVENTORY',
      `Deleted product ${product.name} (${product.sku})`
    );

    res.json({ message: `Product "${product.name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. CATEGORIES
// ==========================================

apiRouter.get('/categories', authenticateToken, async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category_id: cat._id, status: { $ne: 'discontinued' } });
        return {
          id: cat._id.toString(),
          name: cat.name,
          description: cat.description,
          status: cat.status,
          product_count: count,
          created_at: cat.created_at?.toISOString?.() || String(cat.created_at),
        };
      })
    );
    res.json({ categories: categoriesWithCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/categories', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      res.status(400).json({ error: `Category "${name}" already exists.` });
      return;
    }

    const category = await Category.create({ name: name.trim(), description: description.trim(), status: 'active' });

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'CATEGORY_CREATED', 'CATEGORIES', `Created category ${category.name}`);

    res.status(201).json({ id: category._id.toString(), message: 'Category created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/categories/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const cat = await Category.findById(id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    if (name) cat.name = name.trim();
    if (description !== undefined) cat.description = description.trim();
    await cat.save();

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'CATEGORY_UPDATED', 'CATEGORIES', `Updated category ${cat.name}`);

    res.json({ message: 'Category updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/categories/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productCount = await Product.countDocuments({ category_id: id });
    if (productCount > 0) {
      res.status(400).json({ error: `Cannot delete category containing ${productCount} active products. Reassign them first.` });
      return;
    }

    const cat = await Category.findByIdAndDelete(id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'CATEGORY_DELETED', 'CATEGORIES', `Deleted category ${cat.name}`);

    res.json({ message: 'Category deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SUPPLIERS
// ==========================================

apiRouter.get('/suppliers', authenticateToken, async (_req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ company_name: 1 }).lean();
    const suppliersWithCount = await Promise.all(
      suppliers.map(async (s) => {
        const count = await Product.countDocuments({ supplier_id: s._id });
        return {
          id: s._id.toString(),
          supplier_code: s.supplier_code,
          company_name: s.company_name,
          contact_person: s.contact_person,
          email: s.email,
          phone: s.phone,
          address: s.address,
          city: s.city,
          country: s.country,
          status: s.status,
          notes: s.notes,
          product_count: count,
          created_at: s.created_at?.toISOString?.() || String(s.created_at),
        };
      })
    );
    res.json({ suppliers: suppliersWithCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const s = await Supplier.findById(id).lean();
    if (!s) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    const productsRaw = await Product.find({ supplier_id: id }).lean();
    const purchaseOrdersRaw = await PurchaseOrder.find({ supplier_id: id }).sort({ created_at: -1 }).lean();

    res.json({
      supplier: {
        id: s._id.toString(),
        supplier_code: s.supplier_code,
        company_name: s.company_name,
        contact_person: s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        country: s.country,
        status: s.status,
        notes: s.notes,
      },
      products: productsRaw.map((p: any) => ({
        id: p._id.toString(),
        sku: p.sku,
        name: p.name,
        quantity: p.quantity,
        cost_price: p.cost_price,
        selling_price: p.selling_price,
      })),
      purchaseHistory: purchaseOrdersRaw.map((po: any) => ({
        id: po._id.toString(),
        po_number: po.po_number,
        total_amount: po.total_amount,
        status: po.status,
        created_at: po.created_at?.toISOString?.() || String(po.created_at),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/suppliers', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplier_code, company_name, contact_person = '', email, phone = '', address = '', city = '', country = '', notes = '' } = req.body;
    if (!company_name || !email) {
      res.status(400).json({ error: 'Company name and email are required.' });
      return;
    }

    const code = supplier_code ? supplier_code.trim() : `SUP-${Date.now().toString().slice(-4)}`;
    const supplier = await Supplier.create({
      supplier_code: code,
      company_name: company_name.trim(),
      contact_person: contact_person.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      notes: notes.trim(),
      status: 'active',
    });

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'SUPPLIER_CREATED', 'SUPPLIERS', `Created supplier ${supplier.company_name}`);

    res.status(201).json({ id: supplier._id.toString(), message: 'Supplier added successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/suppliers/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    const { company_name, contact_person, email, phone, address, city, country, status, notes } = req.body;
    if (company_name) supplier.company_name = company_name.trim();
    if (contact_person !== undefined) supplier.contact_person = contact_person.trim();
    if (email) supplier.email = email.trim();
    if (phone !== undefined) supplier.phone = phone.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (city !== undefined) supplier.city = city.trim();
    if (country !== undefined) supplier.country = country.trim();
    if (status) supplier.status = status;
    if (notes !== undefined) supplier.notes = notes.trim();

    await supplier.save();

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'SUPPLIER_UPDATED', 'SUPPLIERS', `Updated supplier ${supplier.company_name}`);

    res.json({ message: 'Supplier updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. WAREHOUSES & LOCATIONS
// ==========================================

apiRouter.get('/warehouses', authenticateToken, async (_req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 }).lean();
    const warehousesWithStats = await Promise.all(
      warehouses.map(async (w) => {
        const prods = await Product.find({ warehouse_id: w._id }, 'quantity').lean();
        const totalStock = prods.reduce((sum, p) => sum + (p.quantity || 0), 0);
        return {
          id: w._id.toString(),
          warehouse_code: w.warehouse_code,
          name: w.name,
          address: w.address,
          manager_name: w.manager_name,
          contact_number: w.contact_number,
          status: w.status,
          product_count: prods.length,
          total_stock_quantity: totalStock,
          created_at: w.created_at?.toISOString?.() || String(w.created_at),
        };
      })
    );
    res.json({ warehouses: warehousesWithStats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/warehouses', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { warehouse_code, name, address, manager_name = '', contact_number = '' } = req.body;
    if (!name || !address) {
      res.status(400).json({ error: 'Warehouse name and address are required.' });
      return;
    }

    const code = warehouse_code ? warehouse_code.trim() : `WH-${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;
    const warehouse = await Warehouse.create({
      warehouse_code: code,
      name: name.trim(),
      address: address.trim(),
      manager_name: manager_name.trim(),
      contact_number: contact_number.trim(),
      status: 'active',
    });

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'WAREHOUSE_CREATED', 'WAREHOUSES', `Created warehouse ${warehouse.name}`);

    res.status(201).json({ id: warehouse._id.toString(), message: 'Warehouse created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/warehouses/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found.' });
      return;
    }

    const { name, address, manager_name, contact_number, status } = req.body;
    if (name) warehouse.name = name.trim();
    if (address) warehouse.address = address.trim();
    if (manager_name !== undefined) warehouse.manager_name = manager_name.trim();
    if (contact_number !== undefined) warehouse.contact_number = contact_number.trim();
    if (status) warehouse.status = status;

    await warehouse.save();

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'WAREHOUSE_UPDATED', 'WAREHOUSES', `Updated warehouse ${warehouse.name}`);

    res.json({ message: 'Warehouse updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. STOCK MOVEMENTS & MANUAL ADJUSTMENTS
// ==========================================

apiRouter.get('/movements', authenticateToken, async (req, res) => {
  try {
    const { product_id, type, limit = '50' } = req.query as Record<string, string>;
    const filter: any = {};
    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      filter.product_id = product_id;
    }
    if (type) {
      filter.movement_type = type;
    }

    const movements = await StockMovement.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit, 10) || 50)
      .populate('product_id', 'name sku unit_of_measure')
      .populate('user_id', 'name role')
      .lean();

    const formatted = movements.map((m: any) => ({
      id: m._id.toString(),
      transaction_code: m.transaction_code,
      product_id: m.product_id?._id?.toString() || m.product_id?.toString(),
      product_name: m.product_id?.name || 'Unknown',
      sku: m.product_id?.sku || '',
      unit_of_measure: m.product_id?.unit_of_measure || 'pcs',
      quantity: m.quantity,
      previous_quantity: m.previous_quantity,
      new_quantity: m.new_quantity,
      movement_type: m.movement_type,
      user_id: m.user_id?._id?.toString() || '',
      user_name: m.user_id?.name || 'System',
      user_role: m.user_id?.role || '',
      source_location: m.source_location,
      destination_location: m.destination_location,
      reason: m.reason,
      created_at: m.created_at?.toISOString?.() || String(m.created_at),
    }));

    res.json({ movements: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Stock Adjustment (Admin or Manager only)
apiRouter.post('/movements/adjust', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, adjustment_type, quantity, reason, location = 'Warehouse Storage' } = req.body;
    if (!product_id || !adjustment_type || quantity === undefined || !reason) {
      res.status(400).json({ error: 'Product, adjustment type, quantity, and reason are required.' });
      return;
    }

    const product = await Product.findById(product_id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const prevQty = product.quantity;
    let delta = 0;
    let newQty = prevQty;
    let movementType: 'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Return' = 'Stock Adjustment';

    const numQty = Number(quantity);

    if (adjustment_type === 'add' || adjustment_type === 'Stock In') {
      delta = Math.abs(numQty);
      newQty = prevQty + delta;
      movementType = 'Stock In';
    } else if (adjustment_type === 'subtract' || adjustment_type === 'Stock Out') {
      delta = -Math.abs(numQty);
      newQty = Math.max(0, prevQty + delta);
      movementType = 'Stock Out';
    } else if (adjustment_type === 'Return') {
      delta = Math.abs(numQty);
      newQty = prevQty + delta;
      movementType = 'Return';
    } else {
      // 'set' or 'Stock Adjustment'
      newQty = Math.max(0, numQty);
      delta = newQty - prevQty;
      movementType = 'Stock Adjustment';
    }

    product.quantity = newQty;
    await product.save();

    const transactionCode = `MOV-${Date.now().toString().slice(-6)}`;
    await StockMovement.create({
      transaction_code: transactionCode,
      product_id: product._id,
      quantity: delta,
      previous_quantity: prevQty,
      new_quantity: newQty,
      movement_type: movementType,
      user_id: new mongoose.Types.ObjectId(req.user!.id),
      source_location: delta >= 0 ? 'Adjustment / Receipt' : location,
      destination_location: delta >= 0 ? location : 'Scrap / Write-off / Dispatch',
      reason: reason.trim(),
    });

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'STOCK_ADJUSTMENT',
      'INVENTORY',
      `Adjusted ${product.name} (${product.sku}): ${prevQty} -> ${newQty} (${delta >= 0 ? '+' : ''}${delta}). Reason: ${reason}`
    );

    if (newQty <= product.reorder_level) {
      createNotification(
        null,
        'Low Stock Alert',
        `${product.name} (${product.sku}) is now at or below safety stock (${newQty} remaining).`,
        'warning',
        '/inventory'
      );
    }

    res.json({
      message: `Stock adjusted successfully. Current balance: ${newQty} ${product.unit_of_measure}.`,
      previousQuantity: prevQty,
      newQuantity: newQty,
      transactionCode,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. STOCK REQUESTS
// ==========================================

apiRouter.get('/requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const filter: any = {};
    if (user.role === 'employee') {
      filter.employee_id = user.id;
    }

    const requests = await StockRequest.find(filter)
      .sort({ created_at: -1 })
      .populate('product_id', 'name sku unit_of_measure quantity')
      .populate('employee_id', 'name email department')
      .populate('approved_by', 'name')
      .lean();

    const formatted = requests.map((r: any) => ({
      id: r._id.toString(),
      request_code: r.request_code,
      employee_id: r.employee_id?._id?.toString() || '',
      employee_name: r.employee_id?.name || 'Staff',
      employee_email: r.employee_id?.email || '',
      department: r.department,
      product_id: r.product_id?._id?.toString() || '',
      product_name: r.product_id?.name || '',
      sku: r.product_id?.sku || '',
      unit_of_measure: r.product_id?.unit_of_measure || 'pcs',
      current_stock: r.product_id?.quantity || 0,
      requested_quantity: r.requested_quantity,
      reason: r.reason,
      status: r.status,
      approved_by: r.approved_by?._id?.toString() || undefined,
      approved_by_name: r.approved_by?.name || undefined,
      approval_date: r.approval_date || undefined,
      comments: r.comments || '',
      created_at: r.created_at?.toISOString?.() || String(r.created_at),
      updated_at: r.updated_at?.toISOString?.() || String(r.updated_at),
    }));

    res.json({ requests: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Stock Request
apiRouter.post('/requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, requested_quantity, reason = '', department } = req.body;
    if (!product_id || !requested_quantity) {
      res.status(400).json({ error: 'Product and requested quantity are required.' });
      return;
    }

    const qty = parseInt(requested_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: 'Requested quantity must be at least 1.' });
      return;
    }

    const product = await Product.findById(product_id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const userDept = department || req.user!.department || 'Operations';
    const requestCode = `REQ-${Date.now().toString().slice(-6)}`;

    const newReq = await StockRequest.create({
      request_code: requestCode,
      employee_id: new mongoose.Types.ObjectId(req.user!.id),
      department: userDept,
      product_id: product._id,
      requested_quantity: qty,
      reason: reason.trim(),
      status: 'Pending',
    });

    createNotification(
      null,
      'New Stock Request',
      `${req.user!.name} requested ${qty}x ${product.name} for ${userDept}.`,
      'info',
      '/stock-requests'
    );

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'STOCK_REQUEST_CREATED',
      'REQUESTS',
      `Submitted stock request ${requestCode} for ${qty}x ${product.name}`
    );

    res.status(201).json({ id: newReq._id.toString(), requestCode, message: 'Stock request submitted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Review/Approve/Reject Stock Request (Admin or Manager only)
apiRouter.put('/requests/:id/review', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments = '' } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be Approved or Rejected.' });
      return;
    }

    const stockReq = await StockRequest.findById(id);
    if (!stockReq) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    // Business rule: Employees cannot approve their own request
    if (stockReq.employee_id.toString() === req.user!.id) {
      res.status(403).json({ error: 'Self-approval forbidden. You cannot approve your own stock request.' });
      return;
    }

    if (stockReq.status !== 'Pending') {
      res.status(400).json({ error: `Cannot change status of a request that is already ${stockReq.status}.` });
      return;
    }

    stockReq.status = status;
    stockReq.approved_by = new mongoose.Types.ObjectId(req.user!.id);
    stockReq.approval_date = new Date().toISOString().slice(0, 10);
    stockReq.comments = comments.trim();
    await stockReq.save();

    createNotification(
      stockReq.employee_id,
      `Stock Request ${status}`,
      `Your request ${stockReq.request_code} was ${status.toLowerCase()} by ${req.user!.name}.${comments ? ' Comments: ' + comments : ''}`,
      status === 'Approved' ? 'success' : 'alert',
      '/my-requests'
    );

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      `STOCK_REQUEST_${status.toUpperCase()}`,
      'REQUESTS',
      `${status} requisition ${stockReq.request_code}`
    );

    res.json({ message: `Request successfully ${status.toLowerCase()}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fulfill Stock Request (Issue inventory)
apiRouter.post('/requests/:id/fulfill', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stockReq = await StockRequest.findById(id);
    if (!stockReq) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    if (stockReq.status !== 'Approved') {
      res.status(400).json({ error: 'Only Approved requests can be fulfilled.' });
      return;
    }

    const product = await Product.findById(stockReq.product_id);
    if (!product) {
      res.status(404).json({ error: 'Product record missing.' });
      return;
    }

    if (product.quantity < stockReq.requested_quantity) {
      res.status(400).json({
        error: `Insufficient inventory to fulfill request. Current stock is ${product.quantity}, requested ${stockReq.requested_quantity}.`,
      });
      return;
    }

    const prevQty = product.quantity;
    const newQty = prevQty - stockReq.requested_quantity;
    product.quantity = newQty;
    await product.save();

    const movCode = `MOV-${Date.now().toString().slice(-6)}`;
    await StockMovement.create({
      transaction_code: movCode,
      product_id: product._id,
      quantity: -stockReq.requested_quantity,
      previous_quantity: prevQty,
      new_quantity: newQty,
      movement_type: 'Stock Out',
      user_id: new mongoose.Types.ObjectId(req.user!.id),
      source_location: 'Warehouse Depot',
      destination_location: `Department Requisition: ${stockReq.department}`,
      reason: `Fulfilled stock request ${stockReq.request_code}`,
    });

    stockReq.status = 'Fulfilled';
    await stockReq.save();

    createNotification(
      stockReq.employee_id,
      'Stock Request Fulfilled',
      `Requisition ${stockReq.request_code} (${stockReq.requested_quantity}x ${product.name}) has been fulfilled and issued.`,
      'success',
      '/my-requests'
    );

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'STOCK_REQUEST_FULFILLED',
      'REQUESTS',
      `Fulfilled ${stockReq.request_code}, deducted ${stockReq.requested_quantity}x ${product.name}`
    );

    res.json({ message: 'Stock request fulfilled and inventory updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. PURCHASE ORDERS & STOCK RECEIVING
// ==========================================

apiRouter.get('/purchase-orders', authenticateToken, async (_req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .sort({ created_at: -1 })
      .populate('supplier_id', 'company_name email')
      .populate('warehouse_id', 'name address')
      .populate('requested_by', 'name')
      .lean();

    const formatted = orders.map((o: any) => ({
      id: o._id.toString(),
      po_number: o.po_number,
      supplier_id: o.supplier_id?._id?.toString() || '',
      supplier_name: o.supplier_id?.company_name || '',
      supplier_email: o.supplier_id?.email || '',
      warehouse_id: o.warehouse_id?._id?.toString() || '',
      warehouse_name: o.warehouse_id?.name || '',
      warehouse_address: o.warehouse_id?.address || '',
      requested_by: o.requested_by?._id?.toString() || '',
      requested_by_name: o.requested_by?.name || '',
      expected_delivery_date: o.expected_delivery_date,
      notes: o.notes,
      status: o.status,
      subtotal: o.subtotal,
      tax_rate: o.tax_rate,
      tax_amount: o.tax_amount,
      discount_amount: o.discount_amount,
      total_amount: o.total_amount,
      item_count: o.items?.length || 0,
      created_at: o.created_at?.toISOString?.() || String(o.created_at),
      updated_at: o.updated_at?.toISOString?.() || String(o.updated_at),
    }));

    res.json({ orders: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/purchase-orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const po = await PurchaseOrder.findById(id)
      .populate('supplier_id', 'company_name email contact_person')
      .populate('warehouse_id', 'name address')
      .populate('requested_by', 'name')
      .populate('items.product_id', 'name sku unit_of_measure quantity')
      .lean();

    if (!po) {
      res.status(404).json({ error: 'Purchase Order not found.' });
      return;
    }

    const items = (po.items || []).map((it: any) => ({
      id: it._id?.toString() || '',
      product_id: it.product_id?._id?.toString() || it.product_id?.toString(),
      product_name: it.product_id?.name || 'Unknown',
      sku: it.product_id?.sku || '',
      unit_of_measure: it.product_id?.unit_of_measure || 'pcs',
      current_stock: it.product_id?.quantity || 0,
      quantity_ordered: it.quantity_ordered,
      quantity_received: it.quantity_received || 0,
      unit_price: it.unit_price,
      total_price: it.total_price,
    }));

    const formattedPO = {
      id: po._id.toString(),
      po_number: po.po_number,
      supplier_id: (po.supplier_id as any)?._id?.toString() || '',
      supplier_name: (po.supplier_id as any)?.company_name || '',
      supplier_email: (po.supplier_id as any)?.email || '',
      contact_person: (po.supplier_id as any)?.contact_person || '',
      warehouse_id: (po.warehouse_id as any)?._id?.toString() || '',
      warehouse_name: (po.warehouse_id as any)?.name || '',
      warehouse_address: (po.warehouse_id as any)?.address || '',
      requested_by: (po.requested_by as any)?._id?.toString() || '',
      requested_by_name: (po.requested_by as any)?.name || '',
      expected_delivery_date: po.expected_delivery_date,
      notes: po.notes,
      status: po.status,
      subtotal: po.subtotal,
      tax_rate: po.tax_rate,
      tax_amount: po.tax_amount,
      discount_amount: po.discount_amount,
      total_amount: po.total_amount,
      items,
      created_at: po.created_at?.toISOString?.() || String(po.created_at),
    };

    res.json({ order: formattedPO, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/purchase-orders', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplier_id, warehouse_id, expected_delivery_date, notes = '', tax_rate = 0.15, discount_amount = 0, items } = req.body;

    if (!supplier_id || !warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Supplier, warehouse, and at least one item are required.' });
      return;
    }

    let subtotal = 0;
    const poItems: any[] = [];

    for (const it of items) {
      const { product_id, quantity, unit_price } = it;
      const qty = parseInt(quantity, 10);
      const price = parseFloat(unit_price);
      if (!product_id || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
        res.status(400).json({ error: 'Each item must have a valid product, quantity > 0, and price >= 0.' });
        return;
      }
      const lineTotal = qty * price;
      subtotal += lineTotal;
      poItems.push({
        product_id: new mongoose.Types.ObjectId(String(product_id)),
        quantity_ordered: qty,
        quantity_received: 0,
        unit_price: price,
        total_price: lineTotal,
      });
    }

    const tRate = parseFloat(tax_rate) || 0;
    const dAmount = parseFloat(discount_amount) || 0;
    const taxAmount = (subtotal - dAmount) * tRate;
    const totalAmount = Math.max(0, subtotal - dAmount + taxAmount);

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const newPO = await PurchaseOrder.create({
      po_number: poNumber,
      supplier_id: new mongoose.Types.ObjectId(String(supplier_id)),
      warehouse_id: new mongoose.Types.ObjectId(String(warehouse_id)),
      requested_by: new mongoose.Types.ObjectId(req.user!.id),
      expected_delivery_date: expected_delivery_date || null,
      notes: notes.trim(),
      status: 'Pending Approval',
      subtotal,
      tax_rate: tRate,
      tax_amount: taxAmount,
      discount_amount: dAmount,
      total_amount: totalAmount,
      items: poItems,
    });

    createNotification(
      null,
      'PO Pending Approval',
      `New purchase order ${poNumber} submitted by ${req.user!.name} for R ${totalAmount.toFixed(2)}.`,
      'alert',
      '/purchase-orders'
    );

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'PO_CREATED',
      'PURCHASE',
      `Created purchase order ${poNumber} totalling R ${totalAmount.toFixed(2)}`
    );

    res.status(201).json({ id: newPO._id.toString(), poNumber, status: 'Pending Approval', message: 'Purchase Order created.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update PO Status
apiRouter.put('/purchase-orders/:id/status', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}.` });
      return;
    }

    // Only Admin can approve purchase orders
    if (status === 'Approved' && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Only Administrators have permission to approve Purchase Orders.' });
      return;
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      res.status(404).json({ error: 'PO not found.' });
      return;
    }

    po.status = status;
    await po.save();

    createNotification(
      po.requested_by,
      `PO ${po.po_number} Status Updated`,
      `Purchase order status has been set to "${status}" by ${req.user!.name}.`,
      status === 'Approved' ? 'success' : 'info',
      '/purchase-orders'
    );

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'PO_STATUS_CHANGED', 'PURCHASE', `Updated ${po.po_number} status to ${status}`);

    res.json({ message: `Purchase order status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Receiving Against PO
apiRouter.post('/purchase-orders/:id/receive', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { received_items, notes = '' } = req.body;

    if (!received_items || !Array.isArray(received_items) || received_items.length === 0) {
      res.status(400).json({ error: 'Received items list is required.' });
      return;
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      res.status(404).json({ error: 'Purchase Order not found.' });
      return;
    }

    if (po.status !== 'Approved' && po.status !== 'Ordered' && po.status !== 'Partially Received') {
      res.status(400).json({ error: `Cannot receive items for a PO in '${po.status}' status. PO must be Approved or Ordered.` });
      return;
    }

    let allFulfilled = true;

    for (const rec of received_items) {
      const { item_id, quantity_received, damaged_quantity = 0 } = rec;
      const recQty = Number(quantity_received) || 0;

      const item = po.items.find((it: any) => it._id.toString() === String(item_id) || it.product_id.toString() === String(item_id));
      if (!item) continue;

      item.quantity_received = (item.quantity_received || 0) + recQty;

      if (recQty > 0) {
        // Increment product quantity
        const prod = await Product.findById(item.product_id);
        if (prod) {
          const prevQty = prod.quantity;
          const newQty = prevQty + recQty;
          prod.quantity = newQty;
          await prod.save();

          // Record stock movement
          const movCode = `MOV-${Date.now().toString().slice(-6)}`;
          await StockMovement.create({
            transaction_code: movCode,
            product_id: prod._id,
            quantity: recQty,
            previous_quantity: prevQty,
            new_quantity: newQty,
            movement_type: 'Stock In',
            user_id: new mongoose.Types.ObjectId(req.user!.id),
            source_location: `Supplier Inbound: ${po.po_number}`,
            destination_location: 'Warehouse Receiving Dock',
            reason: `Goods receipt for PO ${po.po_number}${notes ? ': ' + notes : ''}`,
          });
        }
      }

      if (item.quantity_received < item.quantity_ordered) {
        allFulfilled = false;
      }
    }

    po.status = allFulfilled ? 'Received' : 'Partially Received';
    await po.save();

    createNotification(
      po.requested_by,
      `PO ${po.po_number} Goods Received`,
      `Items received for ${po.po_number}. Status is now "${po.status}".`,
      allFulfilled ? 'success' : 'info',
      '/purchase-orders'
    );

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'PO_GOODS_RECEIVED',
      'PURCHASE',
      `Processed inbound shipment for PO ${po.po_number}, status is ${po.status}`
    );

    res.json({ message: 'Goods received and inventory balances updated.', status: po.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. STOCK TRANSFERS BETWEEN WAREHOUSES
// ==========================================

apiRouter.get('/transfers', authenticateToken, async (_req, res) => {
  try {
    const transfers = await StockTransfer.find()
      .sort({ created_at: -1 })
      .populate('product_id', 'name sku unit_of_measure')
      .populate('source_warehouse_id', 'name')
      .populate('destination_warehouse_id', 'name')
      .populate('requested_by', 'name')
      .lean();

    const formatted = transfers.map((st: any) => ({
      id: st._id.toString(),
      transfer_code: st.transfer_code,
      product_id: st.product_id?._id?.toString() || '',
      product_name: st.product_id?.name || '',
      sku: st.product_id?.sku || '',
      unit_of_measure: st.product_id?.unit_of_measure || 'pcs',
      quantity: st.quantity,
      source_warehouse_id: st.source_warehouse_id?._id?.toString() || '',
      source_warehouse_name: st.source_warehouse_id?.name || '',
      destination_warehouse_id: st.destination_warehouse_id?._id?.toString() || '',
      destination_warehouse_name: st.destination_warehouse_id?.name || '',
      requested_by: st.requested_by?._id?.toString() || '',
      requested_by_name: st.requested_by?.name || '',
      reason: st.reason,
      status: st.status,
      created_at: st.created_at?.toISOString?.() || String(st.created_at),
    }));

    res.json({ transfers: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/transfers', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, quantity, source_warehouse_id, destination_warehouse_id, reason = '' } = req.body;

    if (!product_id || !quantity || !source_warehouse_id || !destination_warehouse_id) {
      res.status(400).json({ error: 'Product, quantity, source warehouse, and destination warehouse are required.' });
      return;
    }

    const transferQty = Number(quantity);
    if (transferQty <= 0) {
      res.status(400).json({ error: 'Transfer quantity must be greater than zero.' });
      return;
    }

    if (String(source_warehouse_id) === String(destination_warehouse_id)) {
      res.status(400).json({ error: 'Source and destination warehouses cannot be the same.' });
      return;
    }

    const product = await Product.findById(product_id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    if (product.quantity < transferQty) {
      res.status(400).json({
        error: `Insufficient stock in source warehouse. Available: ${product.quantity}, requested transfer: ${transferQty}.`,
      });
      return;
    }

    const srcWh = await Warehouse.findById(source_warehouse_id);
    const dstWh = await Warehouse.findById(destination_warehouse_id);

    const transferCode = `TRF-${Date.now().toString().slice(-6)}`;
    const transfer = await StockTransfer.create({
      transfer_code: transferCode,
      product_id: product._id,
      quantity: transferQty,
      source_warehouse_id: new mongoose.Types.ObjectId(String(source_warehouse_id)),
      destination_warehouse_id: new mongoose.Types.ObjectId(String(destination_warehouse_id)),
      requested_by: new mongoose.Types.ObjectId(req.user!.id),
      approved_by: new mongoose.Types.ObjectId(req.user!.id),
      reason: reason.trim(),
      status: 'Completed',
    });

    // Update product location
    product.warehouse_id = new mongoose.Types.ObjectId(String(destination_warehouse_id));
    await product.save();

    // Record Stock Movement
    const movCode = `MOV-${Date.now().toString().slice(-6)}`;
    await StockMovement.create({
      transaction_code: movCode,
      product_id: product._id,
      quantity: transferQty,
      previous_quantity: product.quantity,
      new_quantity: product.quantity,
      movement_type: 'Transfer',
      user_id: new mongoose.Types.ObjectId(req.user!.id),
      source_location: srcWh?.name || 'Source Warehouse',
      destination_location: dstWh?.name || 'Destination Warehouse',
      reason: `Transfer ${transferCode}: ${reason}`,
    });

    createAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'STOCK_TRANSFER',
      'TRANSFERS',
      `Transferred ${transferQty} units of ${product.name} from ${srcWh?.name} to ${dstWh?.name}`
    );

    res.status(201).json({ id: transfer._id.toString(), transferCode, message: 'Stock transfer executed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const notifs = await Notification.find({
      $or: [{ user_id: user.id }, { user_id: null }],
    })
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      $or: [{ user_id: user.id }, { user_id: null }],
      is_read: 0,
    });

    const formatted = notifs.map((n: any) => ({
      id: n._id.toString(),
      user_id: n.user_id?.toString() || '',
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.is_read,
      link: n.link,
      created_at: n.created_at?.toISOString?.() || String(n.created_at),
    }));

    res.json({ notifications: formatted, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { is_read: 1 });
    res.json({ message: 'Marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/notifications/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { $or: [{ user_id: req.user!.id }, { user_id: null }] },
      { is_read: 1 }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. USERS MANAGEMENT (Admin only)
// ==========================================

apiRouter.get('/users', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 }).lean();
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        phone: u.phone,
        status: u.status,
        avatar: u.avatar,
        created_at: u.created_at?.toISOString?.() || String(u.created_at),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role = 'employee', department = 'Operations', phone = '' } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and initial password are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'A user account with this email address already exists.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role,
      department: department.trim(),
      phone: phone.trim(),
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'USER_CREATED', 'USERS', `Created user ${user.name} (${user.email})`);

    res.status(201).json({ id: user._id.toString(), message: `User ${user.name} created successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, phone, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (id === req.user!.id && status === 'inactive') {
      res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
      return;
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (department !== undefined) user.department = department.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (status) user.status = status;

    await user.save();

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'USER_UPDATED', 'USERS', `Updated user account ${user.name}`);

    res.json({ message: 'User profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id/reset-password', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    user.password_hash = bcrypt.hashSync(new_password, 8);
    await user.save();

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'USER_PASSWORD_RESET', 'USERS', `Admin reset password for ${user.email}`);

    res.json({ message: `Password reset successfully for ${user.name}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. AUDIT LOGS (Admin only)
// ==========================================

apiRouter.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { module, action, search } = req.query as Record<string, string>;
    const filter: any = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      filter.$or = [{ description: reg }, { user_name: reg }, { action: reg }];
    }

    const logs = await AuditLog.find(filter).sort({ created_at: -1 }).limit(100).lean();

    const formatted = logs.map((l: any) => ({
      id: l._id.toString(),
      user_id: l.user_id?.toString() || null,
      user_name: l.user_name,
      user_role: l.user_role,
      action: l.action,
      module: l.module,
      description: l.description,
      ip_address: l.ip_address,
      created_at: l.created_at?.toISOString?.() || String(l.created_at),
    }));

    res.json({ logs: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 14. REPORTS & EXPORTS (Admin & Manager)
// ==========================================

apiRouter.get('/reports/inventory', authenticateToken, requireRole(['admin', 'manager']), async (_req, res) => {
  try {
    const products = await Product.find({ status: { $ne: 'discontinued' } })
      .populate('category_id', 'name')
      .populate('warehouse_id', 'name')
      .populate('supplier_id', 'company_name')
      .lean();

    let totalStock = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = products.map((p: any) => {
      const qty = p.quantity || 0;
      const cost = p.cost_price || 0;
      const sell = p.selling_price || 0;
      const costVal = qty * cost;
      const retailVal = qty * sell;

      totalStock += qty;
      totalCostValue += costVal;
      totalRetailValue += retailVal;

      return {
        id: p._id.toString(),
        sku: p.sku,
        name: p.name,
        category: p.category_id?.name || '',
        warehouse: p.warehouse_id?.name || '',
        supplier: p.supplier_id?.company_name || '',
        quantity: qty,
        unit_of_measure: p.unit_of_measure,
        cost_price: cost,
        selling_price: sell,
        total_cost_value: costVal,
        total_retail_value: retailVal,
        stock_status: getStockStatus(qty, p.reorder_level),
      };
    });

    res.json({
      items,
      summary: {
        total_items: items.length,
        total_stock: totalStock,
        total_cost_value: totalCostValue,
        total_retail_value: totalRetailValue,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/movements', authenticateToken, requireRole(['admin', 'manager']), async (_req, res) => {
  try {
    const movements = await StockMovement.find()
      .sort({ created_at: -1 })
      .limit(100)
      .populate('product_id', 'name sku unit_of_measure')
      .populate('user_id', 'name')
      .lean();

    const formatted = movements.map((m: any) => ({
      id: m._id.toString(),
      transaction_code: m.transaction_code,
      product_name: m.product_id?.name || '',
      sku: m.product_id?.sku || '',
      quantity: m.quantity,
      movement_type: m.movement_type,
      user_name: m.user_id?.name || 'System',
      source_location: m.source_location,
      destination_location: m.destination_location,
      reason: m.reason,
      created_at: m.created_at?.toISOString?.() || String(m.created_at),
    }));

    res.json({ movements: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/purchases', authenticateToken, requireRole(['admin', 'manager']), async (_req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .sort({ created_at: -1 })
      .populate('supplier_id', 'company_name')
      .populate('warehouse_id', 'name')
      .lean();

    res.json({ purchases: orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/employee-activity', authenticateToken, requireRole(['admin', 'manager']), async (_req, res) => {
  try {
    const requests = await StockRequest.find().populate('employee_id', 'name department').lean();
    const map = new Map<string, any>();

    for (const r of requests) {
      const empName = (r.employee_id as any)?.name || 'Unknown';
      const dept = (r.employee_id as any)?.department || r.department;
      const key = `${empName}-${dept}`;

      if (!map.has(key)) {
        map.set(key, {
          employee_name: empName,
          department: dept,
          total_requests: 0,
          approved_requests: 0,
          rejected_requests: 0,
          fulfilled_requests: 0,
          pending_requests: 0,
        });
      }

      const item = map.get(key);
      item.total_requests++;
      if (r.status === 'Approved') item.approved_requests++;
      if (r.status === 'Rejected') item.rejected_requests++;
      if (r.status === 'Fulfilled') item.fulfilled_requests++;
      if (r.status === 'Pending') item.pending_requests++;
    }

    res.json({ activity: Array.from(map.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 15. SYSTEM SETTINGS
// ==========================================

apiRouter.get('/settings', authenticateToken, async (_req, res) => {
  try {
    const settings = await SystemSetting.find().lean();
    const obj: Record<string, string> = {};
    for (const s of settings) {
      obj[s.key] = s.value;
    }
    res.json({ settings: obj });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/settings', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings object is required.' });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value: String(value) },
        { upsert: true }
      );
    }

    createAuditLog(req.user!.id, req.user!.name, req.user!.role, 'SETTINGS_UPDATED', 'SETTINGS', `Updated global system settings`);

    res.json({ message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 16. GLOBAL SEARCH
// ==========================================

apiRouter.get('/search', authenticateToken, async (req, res) => {
  const { q } = req.query as { q?: string };
  if (!q || !q.trim()) {
    res.json({ products: [], suppliers: [], requests: [], purchaseOrders: [] });
    return;
  }

  try {
    const regex = new RegExp(q.trim(), 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { sku: regex }, { brand: regex }],
    })
      .limit(8)
      .lean();

    const suppliers = await Supplier.find({
      $or: [{ company_name: regex }, { supplier_code: regex }, { email: regex }],
    })
      .limit(5)
      .lean();

    const requests = await StockRequest.find({
      $or: [{ request_code: regex }, { reason: regex }, { department: regex }],
    })
      .populate('product_id', 'name')
      .limit(5)
      .lean();

    const purchaseOrders = await PurchaseOrder.find({
      $or: [{ po_number: regex }, { notes: regex }],
    })
      .populate('supplier_id', 'company_name')
      .limit(5)
      .lean();

    res.json({
      products: products.map((p: any) => ({
        id: p._id.toString(),
        sku: p.sku,
        name: p.name,
        quantity: p.quantity,
        cost_price: p.cost_price,
        selling_price: p.selling_price,
        stock_status: getStockStatus(p.quantity, p.reorder_level),
      })),
      suppliers: suppliers.map((s: any) => ({
        id: s._id.toString(),
        supplier_code: s.supplier_code,
        company_name: s.company_name,
        email: s.email,
      })),
      requests: requests.map((r: any) => ({
        id: r._id.toString(),
        request_code: r.request_code,
        product_name: r.product_id?.name || '',
        requested_quantity: r.requested_quantity,
        status: r.status,
      })),
      purchaseOrders: purchaseOrders.map((po: any) => ({
        id: po._id.toString(),
        po_number: po.po_number,
        supplier_name: po.supplier_id?.company_name || '',
        total_amount: po.total_amount,
        status: po.status,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
