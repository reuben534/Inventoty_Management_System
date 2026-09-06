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
  NotificationItem,
  AuditLog,
  SystemSettings,
  DashboardData,
} from '../types';

let authToken: string | null = localStorage.getItem('inv_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('inv_token', token);
  } else {
    localStorage.removeItem('inv_token');
  }
}

export function getToken(): string | null {
  return authToken || localStorage.getItem('inv_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  getDemoUsers: () => request<{ users: User[]; defaultPassword: string }>('/api/auth/demo-users'),
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getProfile: () => request<{ user: User }>('/api/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string; resetCode: string; email: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; resetCode: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/api/dashboard'),

  // Products & Inventory
  getProducts: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<{
      products: Product[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/products?${query.toString()}`);
  },
  getProduct: (id: string | number) => request<{ product: Product; history: StockMovement[] }>(`/api/products/${id}`),
  createProduct: (product: Partial<Product>) =>
    request<{ id: string | number; message: string }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: string | number, product: Partial<Product>) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  deleteProduct: (id: string | number) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    request<{ id: string | number; message: string }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string | number, data: { name: string; description?: string }) =>
    request<{ message: string }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string | number) =>
    request<{ message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),

  // Suppliers
  getSuppliers: () => request<{ suppliers: Supplier[] }>('/api/suppliers'),
  getSupplier: (id: string | number) =>
    request<{ supplier: Supplier; products: Product[]; purchaseHistory: PurchaseOrder[] }>(`/api/suppliers/${id}`),
  createSupplier: (supplier: Partial<Supplier>) =>
    request<{ id: string | number; message: string }>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),
  updateSupplier: (id: string | number, supplier: Partial<Supplier>) =>
    request<{ message: string }>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    }),

  // Warehouses
  getWarehouses: () => request<{ warehouses: Warehouse[] }>('/api/warehouses'),
  createWarehouse: (warehouse: Partial<Warehouse>) =>
    request<{ id: string | number; message: string }>('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(warehouse),
    }),
  updateWarehouse: (id: string | number, warehouse: Partial<Warehouse>) =>
    request<{ message: string }>(`/api/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(warehouse),
    }),

  // Stock Movements & Adjustments
  getMovements: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<{ movements: StockMovement[] }>(`/api/movements?${query.toString()}`);
  },
  adjustStock: (data: {
    product_id: string | number;
    adjustment_type: 'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Return' | 'add' | 'subtract' | 'set';
    quantity: number;
    reason: string;
    location?: string;
  }) =>
    request<{ message: string; previousQuantity: number; newQuantity: number; transactionCode: string }>(
      '/api/movements/adjust',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Stock Requests
  getRequests: () => request<{ requests: StockRequest[] }>('/api/requests'),
  createRequest: (data: { product_id: string | number; requested_quantity: number; reason: string; department?: string }) =>
    request<{ id: string | number; requestCode: string; message: string }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewRequest: (id: string | number, data: { status: 'Approved' | 'Rejected'; comments?: string }) =>
    request<{ message: string }>(`/api/requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  fulfillRequest: (id: string | number) =>
    request<{ message: string }>(`/api/requests/${id}/fulfill`, {
      method: 'POST',
    }),

  // Purchase Orders
  getPurchaseOrders: () => request<{ orders: PurchaseOrder[] }>('/api/purchase-orders'),
  getPurchaseOrder: (id: string | number) =>
    request<{ order: PurchaseOrder; items: any[] }>(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (data: {
    supplier_id: string | number;
    warehouse_id: string | number;
    expected_delivery_date?: string;
    notes?: string;
    tax_rate?: number;
    discount_amount?: number;
    items: Array<{ product_id: string | number; quantity: number; unit_price: number }>;
  }) =>
    request<{ id: string | number; poNumber: string; status: string; message: string }>('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePOStatus: (id: string | number, status: string) =>
    request<{ message: string }>(`/api/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  receivePOGoods: (id: string | number, data: { received_items: Array<{ item_id: string | number; quantity_received: number; damaged_quantity?: number }>; notes?: string }) =>
    request<{ message: string; status: string }>(`/api/purchase-orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Transfers
  getTransfers: () => request<{ transfers: StockTransfer[] }>('/api/transfers'),
  createTransfer: (data: {
    product_id: string | number;
    quantity: number;
    source_warehouse_id: string | number;
    destination_warehouse_id: string | number;
    reason?: string;
  }) =>
    request<{ id: string | number; transferCode: string; message: string }>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),
  markNotificationRead: (id: string | number) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/api/notifications/read-all', {
      method: 'PUT',
    }),

  // Users (Admin only)
  getUsers: () => request<{ users: User[] }>('/api/users'),
  createUser: (user: Partial<User> & { password: string }) =>
    request<{ id: string | number; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  updateUser: (id: string | number, user: Partial<User>) =>
    request<{ message: string }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  resetUserPassword: (id: string | number, new_password: string) =>
    request<{ message: string }>(`/api/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password }),
    }),

  // Audit Logs (Admin only)
  getAuditLogs: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params);
    return request<{ logs: AuditLog[] }>(`/api/audit-logs?${query.toString()}`);
  },

  // Reports
  getInventoryReport: () =>
    request<{
      items: Array<any>;
      summary: { total_items: number; total_stock: number; total_cost_value: number; total_retail_value: number };
    }>('/api/reports/inventory'),
  getMovementsReport: () => request<{ movements: StockMovement[] }>('/api/reports/movements'),
  getPurchasesReport: () => request<{ purchases: PurchaseOrder[] }>('/api/reports/purchases'),
  getEmployeeActivityReport: () => request<{ activity: any[] }>('/api/reports/employee-activity'),

  // Settings
  getSettings: () => request<{ settings: SystemSettings }>('/api/settings'),
  updateSettings: (settings: SystemSettings) =>
    request<{ message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),

  // Search
  search: (q: string) =>
    request<{
      products: Product[];
      suppliers: Supplier[];
      requests: StockRequest[];
      purchaseOrders: PurchaseOrder[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),
};
