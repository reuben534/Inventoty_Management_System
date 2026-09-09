import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  User,
  Category,
  Supplier,
  Warehouse,
  Product,
  StockMovement,
  StockRequest,
  PurchaseOrder,
  Notification,
  AuditLog,
  SystemSetting,
} from './models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_management';

let isConnected = false;

export async function connectDb(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

  mongoose.set('bufferCommands', false);

  const maxAttempts = 12;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });

      isConnected = true;
      console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      await seedInitialData();
      return conn;
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      console.error(`MongoDB connection attempt ${attempt}/${maxAttempts} failed:`, err);

      if (isLastAttempt) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('MongoDB connection failed after retries');
}

export async function createAuditLog(
  userId: string | mongoose.Types.ObjectId | null,
  userName: string,
  userRole: string,
  action: string,
  module: string,
  description: string,
  ipAddress: string = '127.0.0.1'
): Promise<void> {
  try {
    await AuditLog.create({
      user_id: userId ? new mongoose.Types.ObjectId(String(userId)) : null,
      user_name: userName,
      user_role: userRole,
      action,
      module,
      description,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function createNotification(
  userId: string | mongoose.Types.ObjectId | null,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'alert' = 'info',
  link: string = ''
): Promise<void> {
  try {
    if (!userId) {
      const activeUsers = await User.find({ status: 'active' }, '_id');
      const docs = activeUsers.map((u) => ({
        user_id: u._id,
        title,
        message,
        type,
        is_read: 0,
        link,
      }));
      if (docs.length > 0) {
        await Notification.insertMany(docs);
      }
    } else {
      await Notification.create({
        user_id: new mongoose.Types.ObjectId(String(userId)),
        title,
        message,
        type,
        is_read: 0,
        link,
      });
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

async function seedInitialData(): Promise<void> {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return; // already seeded
  }

  console.log('Seeding initial MERN inventory management data in MongoDB...');

  const defaultPasswordHash = bcrypt.hashSync('Password123!', 8);

  // 1. Users
  const userDefs = [
    { name: 'Sarah Jenkins (Admin)', email: 'admin@inventory.com', role: 'admin', dept: 'Executive Management', phone: '+1 (555) 100-0001' },
    { name: 'Marcus Vance (Manager)', email: 'manager@inventory.com', role: 'manager', dept: 'Warehouse Operations', phone: '+1 (555) 200-0002' },
    { name: 'Elena Rostova (Manager)', email: 'elena.manager@inventory.com', role: 'manager', dept: 'Supply Chain & Procurement', phone: '+1 (555) 200-0003' },
    { name: 'David Chen (Employee)', email: 'employee1@inventory.com', role: 'employee', dept: 'Inbound Logistics', phone: '+1 (555) 300-0004' },
    { name: 'Amara Okafor (Employee)', email: 'employee2@inventory.com', role: 'employee', dept: 'Assembly & Packaging', phone: '+1 (555) 300-0005' },
    { name: 'Liam Gallagher (Employee)', email: 'employee3@inventory.com', role: 'employee', dept: 'Quality Control', phone: '+1 (555) 300-0006' },
    { name: 'Sophia Martinez (Employee)', email: 'employee4@inventory.com', role: 'employee', dept: 'Fulfillment & Dispatch', phone: '+1 (555) 300-0007' },
    { name: 'Jackson Reed (Employee)', email: 'employee5@inventory.com', role: 'employee', dept: 'Maintenance & Repairs', phone: '+1 (555) 300-0008' },
  ];

  const createdUsers = await User.insertMany(
    userDefs.map((u) => ({
      name: u.name,
      email: u.email,
      password_hash: defaultPasswordHash,
      role: u.role,
      department: u.dept,
      phone: u.phone,
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
    }))
  );

  // 2. Categories
  const categoryDefs = [
    { name: 'Industrial Electronics', description: 'Microcontrollers, sensors, power supplies, and cabling' },
    { name: 'Storage & Packaging', description: 'Corrugated boxes, heavy duty pallets, stretch film, and totes' },
    { name: 'Safety & PPE Equipment', description: 'Hard hats, high-vis vests, steel-toe boots, and safety gloves' },
    { name: 'Machinery & Power Tools', description: 'Pneumatic drivers, drills, hydraulic lifts, and torque wrenches' },
    { name: 'Office & Facility Supplies', description: 'Barcode scanners, label rolls, thermal printers, and consumables' },
  ];

  const createdCategories = await Category.insertMany(categoryDefs.map((c) => ({ ...c, status: 'active' })));

  // 3. Suppliers
  const supplierDefs = [
    { supplier_code: 'SUP-001', company_name: 'Apex Hardware Global', contact_person: 'Robert Lang', email: 'orders@apexhardware.com', phone: '+1 800-555-0199', address: '450 Industrial Parkway', city: 'Detroit', country: 'United States', status: 'active', notes: 'Primary contracted vendor with 30-day net terms.' },
    { supplier_code: 'SUP-002', company_name: 'Optima Sensorics Ltd', contact_person: 'Hana Tanaka', email: 'sales@optimasensors.jp', phone: '+81 3-5555-0144', address: '12-4 Chiyoda Tech Ave', city: 'Tokyo', country: 'Japan', status: 'active', notes: 'Primary contracted vendor with 30-day net terms.' },
    { supplier_code: 'SUP-003', company_name: 'Vanguard Industrial PPE', contact_person: 'Klaus Webber', email: 'supply@vanguardppe.de', phone: '+49 89-555-0182', address: 'Bavariaring 88', city: 'Munich', country: 'Germany', status: 'active', notes: 'Primary contracted vendor with 30-day net terms.' },
    { supplier_code: 'SUP-004', company_name: 'PacMaster Packaging Systems', contact_person: 'Lisa Gomez', email: 'accounts@pacmaster.com', phone: '+1 888-555-0120', address: '102 Distribution Way', city: 'Chicago', country: 'United States', status: 'active', notes: 'Primary contracted vendor with 30-day net terms.' },
    { supplier_code: 'SUP-005', company_name: 'CyberPrint Technologies', contact_person: 'Arthur Pendelton', email: 'enterprise@cyberprint.com', phone: '+1 877-555-0165', address: '980 Silicon Boulevard', city: 'Austin', country: 'United States', status: 'active', notes: 'Primary contracted vendor with 30-day net terms.' },
  ];

  const createdSuppliers = await Supplier.insertMany(supplierDefs);

  // 4. Warehouses
  const warehouseDefs = [
    { warehouse_code: 'WH-CENTRAL', name: 'Main Distribution Hub', address: '700 Logistics Expressway, Sector 4, Chicago, IL', manager_name: 'Marcus Vance', contact_number: '+1 (312) 555-7800', status: 'active' },
    { warehouse_code: 'WH-COASTAL', name: 'Pacific Coast Warehouse', address: '220 Harbor Freight Ave, Dock 14, Long Beach, CA', manager_name: 'Elena Rostova', contact_number: '+1 (562) 555-4300', status: 'active' },
  ];

  const createdWarehouses = await Warehouse.insertMany(warehouseDefs);

  // 5. Products
  const productDefs = [
    { sku: 'ELC-8821', name: 'Precision Ultrasonic Distance Sensor', catIdx: 0, brand: 'Optima', supIdx: 1, whIdx: 0, uom: 'pcs', cost: 14.50, sell: 28.00, qty: 145, min: 20, max: 300, reorder: 35 },
    { sku: 'ELC-9043', name: 'Embedded ARM Cortex-M4 Microcontroller', catIdx: 0, brand: 'Optima', supIdx: 1, whIdx: 0, uom: 'pcs', cost: 22.00, sell: 45.00, qty: 84, min: 15, max: 200, reorder: 30 },
    { sku: 'ELC-1049', name: 'Heavy-Duty 24V Industrial Power Supply (480W)', catIdx: 0, brand: 'Apex', supIdx: 0, whIdx: 1, uom: 'units', cost: 65.00, sell: 110.00, qty: 18, min: 10, max: 80, reorder: 25 },
    { sku: 'ELC-3382', name: 'Shielded Cat6A Bulk Ethernet Spool (1000ft)', catIdx: 0, brand: 'Apex', supIdx: 0, whIdx: 0, uom: 'spools', cost: 115.00, sell: 195.00, qty: 6, min: 5, max: 40, reorder: 12 },
    { sku: 'ELC-5510', name: 'Optocoupler Relay Isolation Module (8-Channel)', catIdx: 0, brand: 'Optima', supIdx: 1, whIdx: 1, uom: 'pcs', cost: 8.20, sell: 19.90, qty: 0, min: 10, max: 150, reorder: 20 },

    { sku: 'PKG-1002', name: 'Double-Wall Corrugated Heavy Shipping Box (18x18x16)', catIdx: 1, brand: 'PacMaster', supIdx: 3, whIdx: 0, uom: 'bundles', cost: 24.00, sell: 42.00, qty: 320, min: 50, max: 800, reorder: 100 },
    { sku: 'PKG-2041', name: 'Heat-Treated Euro Wood Shipping Pallet (48x40)', catIdx: 1, brand: 'PacMaster', supIdx: 3, whIdx: 1, uom: 'pallets', cost: 18.50, sell: 32.00, qty: 65, min: 20, max: 250, reorder: 40 },
    { sku: 'PKG-3088', name: 'Industrial Cast Stretch Film Roll (80 Gauge 18")', catIdx: 1, brand: 'PacMaster', supIdx: 3, whIdx: 0, uom: 'rolls', cost: 12.00, sell: 24.50, qty: 112, min: 30, max: 400, reorder: 50 },
    { sku: 'PKG-4190', name: 'Anti-Static Poly Bubble Cushioning Wrap (350ft)', catIdx: 1, brand: 'PacMaster', supIdx: 3, whIdx: 1, uom: 'rolls', cost: 38.00, sell: 68.00, qty: 9, min: 8, max: 80, reorder: 15 },

    { sku: 'PPE-4011', name: 'ANSI Class 2 High-Visibility Reflective Vest', catIdx: 2, brand: 'Vanguard', supIdx: 2, whIdx: 0, uom: 'pcs', cost: 6.50, sell: 15.00, qty: 240, min: 30, max: 500, reorder: 60 },
    { sku: 'PPE-5022', name: 'Vented Full-Brim Industrial Safety Helmet', catIdx: 2, brand: 'Vanguard', supIdx: 2, whIdx: 1, uom: 'units', cost: 19.00, sell: 38.00, qty: 72, min: 15, max: 150, reorder: 25 },
    { sku: 'PPE-6033', name: 'Level 5 Cut-Resistant Nitrile Coated Gloves (Box of 12)', catIdx: 2, brand: 'Vanguard', supIdx: 2, whIdx: 0, uom: 'boxes', cost: 28.00, sell: 54.00, qty: 4, min: 10, max: 100, reorder: 20 },
    { sku: 'PPE-7044', name: 'Anti-Fog Chemical Splash Safety Goggles', catIdx: 2, brand: 'Vanguard', supIdx: 2, whIdx: 1, uom: 'pairs', cost: 5.50, sell: 12.50, qty: 180, min: 25, max: 300, reorder: 40 },
    { sku: 'PPE-8055', name: 'Steel-Toe Slip-Resistant Work Boots (Size 10.5)', catIdx: 2, brand: 'Vanguard', supIdx: 2, whIdx: 0, uom: 'pairs', cost: 52.00, sell: 98.00, qty: 0, min: 5, max: 60, reorder: 10 },

    { sku: 'MCH-1102', name: '18V Brushless Cordless Impact Driver Kit', catIdx: 3, brand: 'Apex', supIdx: 0, whIdx: 0, uom: 'kits', cost: 95.00, sell: 175.00, qty: 28, min: 5, max: 60, reorder: 10 },
    { sku: 'MCH-2204', name: 'Hydraulic Hand Pallet Truck (5,500 lb Capacity)', catIdx: 3, brand: 'Apex', supIdx: 0, whIdx: 1, uom: 'units', cost: 260.00, sell: 420.00, qty: 12, min: 3, max: 25, reorder: 5 },
    { sku: 'MCH-3306', name: 'Calibrated Digital Torque Wrench (10-150 ft-lb)', catIdx: 3, brand: 'Apex', supIdx: 0, whIdx: 0, uom: 'units', cost: 130.00, sell: 220.00, qty: 7, min: 4, max: 30, reorder: 8 },
    { sku: 'MCH-4408', name: 'Variable Speed Heavy Magnetic Drill Press', catIdx: 3, brand: 'Apex', supIdx: 0, whIdx: 1, uom: 'units', cost: 410.00, sell: 690.00, qty: 5, min: 2, max: 15, reorder: 3 },

    { sku: 'OFC-7100', name: 'Rugged Wireless 2D Barcode Scanner with Cradle', catIdx: 4, brand: 'CyberPrint', supIdx: 4, whIdx: 0, uom: 'units', cost: 88.00, sell: 160.00, qty: 34, min: 8, max: 80, reorder: 15 },
    { sku: 'OFC-8200', name: 'Direct Thermal Industrial Shipping Label Printer', catIdx: 4, brand: 'CyberPrint', supIdx: 4, whIdx: 1, uom: 'units', cost: 210.00, sell: 350.00, qty: 14, min: 4, max: 35, reorder: 6 },
    { sku: 'OFC-9300', name: 'Direct Thermal 4x6 Fanfold Shipping Labels (2000/pack)', catIdx: 4, brand: 'CyberPrint', supIdx: 4, whIdx: 0, uom: 'packs', cost: 16.50, sell: 32.00, qty: 85, min: 20, max: 200, reorder: 30 },
    { sku: 'OFC-9400', name: 'Thermal Transfer Resin Ribbon Roll (4.33" x 1476ft)', catIdx: 4, brand: 'CyberPrint', supIdx: 4, whIdx: 1, uom: 'rolls', cost: 11.00, sell: 22.00, qty: 0, min: 10, max: 100, reorder: 20 },
  ];

  const createdProducts = await Product.insertMany(
    productDefs.map((p) => ({
      sku: p.sku,
      name: p.name,
      description: `Industrial grade ${p.name.toLowerCase()} manufactured for standard compliance and continuous daily duty.`,
      category_id: createdCategories[p.catIdx]._id,
      brand: p.brand,
      supplier_id: createdSuppliers[p.supIdx]._id,
      warehouse_id: createdWarehouses[p.whIdx]._id,
      unit_of_measure: p.uom,
      cost_price: p.cost,
      selling_price: p.sell,
      quantity: p.qty,
      min_stock: p.min,
      max_stock: p.max,
      reorder_level: p.reorder,
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
      status: 'active',
    }))
  );

  // 6. Stock Movements
  await StockMovement.insertMany([
    {
      transaction_code: 'MOV-1001',
      product_id: createdProducts[0]._id,
      quantity: 50,
      previous_quantity: 95,
      new_quantity: 145,
      movement_type: 'Stock In',
      user_id: createdUsers[3]._id,
      source_location: 'SUP-002 Vendor Receipt',
      destination_location: 'WH-CENTRAL Bay A3',
      reason: 'PO-8801 Delivery verification',
    },
    {
      transaction_code: 'MOV-1002',
      product_id: createdProducts[5]._id,
      quantity: 100,
      previous_quantity: 220,
      new_quantity: 320,
      movement_type: 'Stock In',
      user_id: createdUsers[3]._id,
      source_location: 'PacMaster Dispatch',
      destination_location: 'WH-CENTRAL Bay B1',
      reason: 'Stock replenishment',
    },
    {
      transaction_code: 'MOV-1003',
      product_id: createdProducts[11]._id,
      quantity: -16,
      previous_quantity: 20,
      new_quantity: 4,
      movement_type: 'Stock Out',
      user_id: createdUsers[4]._id,
      source_location: 'WH-CENTRAL Bay C2',
      destination_location: 'Production Line 3',
      reason: 'Issued for Shift B assembly',
    },
    {
      transaction_code: 'MOV-1004',
      product_id: createdProducts[4]._id,
      quantity: -20,
      previous_quantity: 20,
      new_quantity: 0,
      movement_type: 'Stock Out',
      user_id: createdUsers[4]._id,
      source_location: 'WH-COASTAL Shelf 9',
      destination_location: 'Field Service Team',
      reason: 'Depleted for maintenance overhaul',
    },
    {
      transaction_code: 'MOV-1005',
      product_id: createdProducts[14]._id,
      quantity: 10,
      previous_quantity: 18,
      new_quantity: 28,
      movement_type: 'Stock Adjustment',
      user_id: createdUsers[1]._id,
      source_location: 'WH-CENTRAL',
      destination_location: 'WH-CENTRAL',
      reason: 'Cycle count physical audit adjustment',
    },
  ]);

  // 7. Stock Requests
  await StockRequest.insertMany([
    {
      request_code: 'REQ-501',
      employee_id: createdUsers[3]._id,
      department: 'Inbound Logistics',
      product_id: createdProducts[18]._id,
      requested_quantity: 2,
      reason: 'Replacement for broken scanners at Receiving Dock 2',
      status: 'Pending',
      approved_by: null,
      approval_date: null,
      comments: '',
    },
    {
      request_code: 'REQ-502',
      employee_id: createdUsers[4]._id,
      department: 'Assembly & Packaging',
      product_id: createdProducts[9]._id,
      requested_quantity: 15,
      reason: 'Required for new onboarding staff in Sector B',
      status: 'Approved',
      approved_by: createdUsers[1]._id,
      approval_date: '2026-09-05',
      comments: 'Approved. Collect from WH-CENTRAL cage.',
    },
    {
      request_code: 'REQ-503',
      employee_id: createdUsers[5]._id,
      department: 'Quality Control',
      product_id: createdProducts[16]._id,
      requested_quantity: 1,
      reason: 'Precision torque verification unit testing',
      status: 'Fulfilled',
      approved_by: createdUsers[1]._id,
      approval_date: '2026-09-04',
      comments: 'Handed over on Sep 4th.',
    },
    {
      request_code: 'REQ-504',
      employee_id: createdUsers[6]._id,
      department: 'Fulfillment & Dispatch',
      product_id: createdProducts[20]._id,
      requested_quantity: 10,
      reason: 'Weekly replenishment for packing station #4',
      status: 'Pending',
      approved_by: null,
      approval_date: null,
      comments: '',
    },
    {
      request_code: 'REQ-505',
      employee_id: createdUsers[7]._id,
      department: 'Maintenance & Repairs',
      product_id: createdProducts[13]._id,
      requested_quantity: 3,
      reason: 'Boots replacement due to heavy acid exposure',
      status: 'Rejected',
      approved_by: createdUsers[2]._id,
      approval_date: '2026-09-04',
      comments: 'Item is currently Out of Stock, please re-request when restocked.',
    },
  ]);

  // 8. Purchase Orders
  await PurchaseOrder.create({
    po_number: 'PO-9001',
    supplier_id: createdSuppliers[1]._id,
    warehouse_id: createdWarehouses[0]._id,
    requested_by: createdUsers[1]._id,
    expected_delivery_date: '2026-09-15',
    notes: 'Urgent sensor resupply for next month assembly lines.',
    status: 'Approved',
    subtotal: 3020.00,
    tax_rate: 0.08,
    tax_amount: 241.60,
    discount_amount: 50.00,
    total_amount: 3211.60,
    items: [
      {
        product_id: createdProducts[0]._id,
        quantity_ordered: 100,
        quantity_received: 0,
        unit_price: 14.50,
        total_price: 1450.00,
      },
      {
        product_id: createdProducts[1]._id,
        quantity_ordered: 70,
        quantity_received: 0,
        unit_price: 22.00,
        total_price: 1540.00,
      },
    ],
  });

  await PurchaseOrder.create({
    po_number: 'PO-9002',
    supplier_id: createdSuppliers[2]._id,
    warehouse_id: createdWarehouses[0]._id,
    requested_by: createdUsers[2]._id,
    expected_delivery_date: '2026-09-18',
    notes: 'PPE safety stock replenishment for winter cycle.',
    status: 'Pending Approval',
    subtotal: 1680.00,
    tax_rate: 0.08,
    tax_amount: 134.40,
    discount_amount: 0.00,
    total_amount: 1814.40,
    items: [
      {
        product_id: createdProducts[11]._id,
        quantity_ordered: 60,
        quantity_received: 0,
        unit_price: 28.00,
        total_price: 1680.00,
      },
    ],
  });

  // 9. Notifications
  await Notification.insertMany([
    {
      user_id: createdUsers[0]._id,
      title: 'Purchase Order Approval Needed',
      message: 'PO-9002 submitted by Elena Rostova is pending your review.',
      type: 'alert',
      is_read: 0,
      link: '/purchase-orders',
    },
    {
      user_id: createdUsers[0]._id,
      title: 'Critical Stock Alert',
      message: 'Relay Isolation Module (ELC-5510) and Steel-Toe Boots are completely Out of Stock.',
      type: 'warning',
      is_read: 0,
      link: '/inventory',
    },
    {
      user_id: createdUsers[1]._id,
      title: 'New Stock Request',
      message: 'David Chen submitted REQ-501 for 2x Barcode Scanners.',
      type: 'info',
      is_read: 0,
      link: '/stock-requests',
    },
    {
      user_id: createdUsers[3]._id,
      title: 'Request REQ-502 Approved',
      message: 'Your request for 15x High-Visibility Vests was approved by Marcus Vance.',
      type: 'success',
      is_read: 0,
      link: '/my-requests',
    },
  ]);

  // 10. Audit Logs
  await AuditLog.insertMany([
    {
      user_id: createdUsers[0]._id,
      user_name: 'Sarah Jenkins',
      user_role: 'admin',
      action: 'SYSTEM_INITIALIZED',
      module: 'SYSTEM',
      description: 'MongoDB warehouse schema initialized with seed master data',
      ip_address: '127.0.0.1',
    },
    {
      user_id: createdUsers[0]._id,
      user_name: 'Sarah Jenkins',
      user_role: 'admin',
      action: 'USER_CREATED',
      module: 'USERS',
      description: 'Created user account David Chen with role employee',
      ip_address: '127.0.0.1',
    },
    {
      user_id: createdUsers[1]._id,
      user_name: 'Marcus Vance',
      user_role: 'manager',
      action: 'STOCK_ADJUSTMENT',
      module: 'INVENTORY',
      description: 'Adjusted quantity for MCH-1102 (+10 units) after annual audit',
      ip_address: '127.0.0.1',
    },
  ]);

  // 11. System Settings
  const settingsDefs = [
    { key: 'company_name', value: 'Vortex Global Warehousing & Logistics' },
    { key: 'currency', value: 'ZAR (R)' },
    { key: 'default_tax_rate', value: '0.15' },
    { key: 'low_stock_notification_enabled', value: 'true' },
    { key: 'auto_reorder_recommendation', value: 'true' },
    { key: 'allow_negative_stock', value: 'false' },
    { key: 'require_po_approval_above', value: '1000' },
  ];

  await SystemSetting.insertMany(settingsDefs);

  console.log('MongoDB Seeding complete. All initial collections populated.');
}
