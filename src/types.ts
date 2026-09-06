export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
  status: 'active' | 'inactive';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string | number;
  name: string;
  description: string;
  status: 'active' | 'archived';
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string | number;
  supplier_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'archived';
  notes: string;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Warehouse {
  id: string | number;
  warehouse_code: string;
  name: string;
  address: string;
  manager_name: string;
  contact_number: string;
  status: 'active' | 'archived';
  product_count?: number;
  total_stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string | number;
  sku: string;
  name: string;
  description: string;
  category_id: string | number;
  brand: string;
  supplier_id: string | number;
  warehouse_id: string | number;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  reorder_level: number;
  image_url: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  category_name?: string;
  supplier_name?: string;
  warehouse_name?: string;
  created_at?: string;
  updated_at?: string;
}

export type MovementType = 'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Transfer' | 'Return';

export interface StockMovement {
  id: string | number;
  transaction_code: string;
  product_id: string | number;
  product_name?: string;
  sku?: string;
  unit_of_measure?: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  movement_type: MovementType;
  user_id: string | number;
  user_name?: string;
  user_role?: string;
  source_location: string;
  destination_location: string;
  reason: string;
  created_at: string;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';

export interface StockRequest {
  id: string | number;
  request_code: string;
  employee_id: string | number;
  employee_name?: string;
  employee_email?: string;
  department: string;
  product_id: string | number;
  product_name?: string;
  sku?: string;
  unit_of_measure?: string;
  current_stock?: number;
  requested_quantity: number;
  reason: string;
  status: RequestStatus;
  approved_by?: string | number;
  approved_by_name?: string;
  approval_date?: string;
  comments?: string;
  created_at: string;
  updated_at?: string;
}

export type POStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export interface PurchaseOrderItem {
  id: string | number;
  po_id?: string | number;
  product_id: string | number;
  product_name?: string;
  sku?: string;
  unit_of_measure?: string;
  current_stock?: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrder {
  id: string | number;
  po_number: string;
  supplier_id: string | number;
  supplier_name?: string;
  supplier_email?: string;
  contact_person?: string;
  warehouse_id: string | number;
  warehouse_name?: string;
  warehouse_address?: string;
  requested_by: string | number;
  requested_by_name?: string;
  expected_delivery_date?: string;
  notes?: string;
  status: POStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  item_count?: number;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface StockTransfer {
  id: string | number;
  transfer_code: string;
  product_id: string | number;
  product_name?: string;
  sku?: string;
  unit_of_measure?: string;
  quantity: number;
  source_warehouse_id: string | number;
  source_warehouse_name?: string;
  destination_warehouse_id: string | number;
  destination_warehouse_name?: string;
  requested_by: string | number;
  requested_by_name?: string;
  approved_by?: string | number;
  reason: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface NotificationItem {
  id: string | number;
  user_id: string | number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string | number;
  user_id: string | number | null;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface SystemSettings {
  [key: string]: string;
}

export interface DashboardData {
  metrics: {
    totalProducts: number;
    totalInventoryValue?: number;
    totalStockQuantity?: number;
    availableStock?: number;
    availableProducts?: number;
    lowStockProducts?: number;
    outOfStockProducts?: number;
    lowStockItemsCount?: number;
    pendingRequests?: number;
    pendingEmployeeRequestsCount?: number;
    pendingPurchaseOrders?: number;
    pendingPurchaseRequestsCount?: number;
    numberOfEmployees?: number;
    numberOfManagers?: number;
    numberOfSuppliers?: number;
    myPendingRequests?: number;
    myApprovedRequests?: number;
    myRejectedRequests?: number;
  };
  categoryStats?: Array<{ name: string; product_count: number; total_qty: number; total_value: number }>;
  warehouseStats?: Array<{ name: string; product_count: number; total_stock: number }>;
  lowStockItems?: Array<{
    id: string | number;
    sku: string;
    name: string;
    quantity: number;
    reorder_level: number;
    unit_of_measure: string;
    warehouse_name: string;
    stock_status: string;
  }>;
  recentMovements?: StockMovement[];
  recentActivity?: AuditLog[];
  pendingEmployeeRequests?: StockRequest[];
  myRecentRequests?: StockRequest[];
}
