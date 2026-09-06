import mongoose, { Schema, Document, Model } from 'mongoose';

const defaultTransform = {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
};

const schemaOptions = {
  toJSON: defaultTransform,
  toObject: defaultTransform,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};

// 1. User
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  avatar: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'employee'], required: true },
    department: { type: String, default: 'Operations' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    avatar: { type: String, default: '' },
  },
  schemaOptions
);

// 2. Category
export interface ICategory extends Document {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  schemaOptions
);

// 3. Supplier
export interface ISupplier extends Document {
  id: string;
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
  created_at: Date;
  updated_at: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplier_code: { type: String, required: true, unique: true, trim: true },
    company_name: { type: String, required: true, trim: true },
    contact_person: { type: String, default: '' },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    notes: { type: String, default: '' },
  },
  schemaOptions
);

// 4. Warehouse
export interface IWarehouse extends Document {
  id: string;
  warehouse_code: string;
  name: string;
  address: string;
  manager_name: string;
  contact_number: string;
  status: 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    warehouse_code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    manager_name: { type: String, default: '' },
    contact_number: { type: String, default: '' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  schemaOptions
);

// 5. Product
export interface IProduct extends Document {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: mongoose.Types.ObjectId;
  brand: string;
  supplier_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  reorder_level: number;
  image_url: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: '' },
    supplier_id: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    unit_of_measure: { type: String, default: 'pcs' },
    cost_price: { type: Number, required: true, default: 0 },
    selling_price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    min_stock: { type: Number, default: 5 },
    max_stock: { type: Number, default: 100 },
    reorder_level: { type: Number, default: 15 },
    image_url: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  },
  schemaOptions
);

// 6. StockMovement
export interface IStockMovement extends Document {
  id: string;
  transaction_code: string;
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  movement_type: 'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Transfer' | 'Return';
  user_id: mongoose.Types.ObjectId | null;
  source_location: string;
  destination_location: string;
  reason: string;
  created_at: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    transaction_code: { type: String, required: true, unique: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    previous_quantity: { type: Number, required: true },
    new_quantity: { type: Number, required: true },
    movement_type: {
      type: String,
      enum: ['Stock In', 'Stock Out', 'Stock Adjustment', 'Transfer', 'Return'],
      required: true,
    },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source_location: { type: String, default: '' },
    destination_location: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  schemaOptions
);

// 7. StockRequest
export interface IStockRequest extends Document {
  id: string;
  request_code: string;
  employee_id: mongoose.Types.ObjectId;
  department: string;
  product_id: mongoose.Types.ObjectId;
  requested_quantity: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';
  approved_by: mongoose.Types.ObjectId | null;
  approval_date: string | null;
  comments: string;
  created_at: Date;
  updated_at: Date;
}

const StockRequestSchema = new Schema<IStockRequest>(
  {
    request_code: { type: String, required: true, unique: true },
    employee_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    requested_quantity: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'],
      default: 'Pending',
    },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approval_date: { type: String, default: null },
    comments: { type: String, default: '' },
  },
  schemaOptions
);

// 8. PurchaseOrder
export interface IPurchaseOrderItem {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  product_id: mongoose.Types.ObjectId;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
}

export interface IPurchaseOrder extends Document {
  id: string;
  po_number: string;
  supplier_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  expected_delivery_date: string | null;
  notes: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items: IPurchaseOrderItem[];
  created_at: Date;
  updated_at: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity_ordered: { type: Number, required: true },
    quantity_received: { type: Number, default: 0 },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
  },
  {
    toJSON: defaultTransform,
    toObject: defaultTransform,
  }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    po_number: { type: String, required: true, unique: true },
    supplier_id: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    requested_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expected_delivery_date: { type: String, default: null },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Cancelled'],
      default: 'Draft',
    },
    subtotal: { type: Number, required: true, default: 0 },
    tax_rate: { type: Number, default: 0.10 },
    tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true, default: 0 },
    items: [PurchaseOrderItemSchema],
  },
  schemaOptions
);

// 9. StockTransfer
export interface IStockTransfer extends Document {
  id: string;
  transfer_code: string;
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  source_warehouse_id: mongoose.Types.ObjectId;
  destination_warehouse_id: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  approved_by: mongoose.Types.ObjectId | null;
  reason: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at: Date;
  updated_at: Date;
}

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    transfer_code: { type: String, required: true, unique: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    source_warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destination_warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    requested_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Completed' },
  },
  schemaOptions
);

// 10. Notification
export interface INotification extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  is_read: number;
  link: string;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'alert'], default: 'info' },
    is_read: { type: Number, default: 0 },
    link: { type: String, default: '' },
  },
  schemaOptions
);

// 11. AuditLog
export interface IAuditLog extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId | null;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    user_name: { type: String, required: true },
    user_role: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    description: { type: String, required: true },
    ip_address: { type: String, default: '127.0.0.1' },
  },
  schemaOptions
);

// 12. SystemSetting
export interface ISystemSetting extends Document {
  key: string;
  value: string;
  updated_at: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  schemaOptions
);

// Compile Mongoose Models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
export const Warehouse: Model<IWarehouse> = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const StockMovement: Model<IStockMovement> = mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
export const StockRequest: Model<IStockRequest> = mongoose.models.StockRequest || mongoose.model<IStockRequest>('StockRequest', StockRequestSchema);
export const PurchaseOrder: Model<IPurchaseOrder> = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
export const StockTransfer: Model<IStockTransfer> = mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const SystemSetting: Model<ISystemSetting> = mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
