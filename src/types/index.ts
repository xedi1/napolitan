// ============================================
// Cafe Napolitan - Type Definitions
// ============================================

// ============================================
// Table Types
// ============================================
export type TableShape = 'circle' | 'rectangle';

export type TableStatus =
  | 'available'
  | 'occupied'
  | 'preparing'
  | 'awaiting'
  | 'eating'
  | 'reserved'
  | 'cleaning';

export type TableFloor = 1 | 2;

export interface TablePosition {
  x: number;
  y: number;
}

export interface Table {
  id: number;
  shape: TableShape;
  group: string;
  position: TablePosition;
  seats: number;
  status: TableStatus;
  floor: TableFloor;
  currentOrderId?: string;
  lastUpdated: number;
}

// ============================================
// User & Auth Types
// ============================================
export type UserRole = 'manager' | 'kitchen' | 'waiter';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: number;
}

export interface RolePermissions {
  canTakeOrder: boolean;
  canViewTables: boolean;
  canUpdateStatus: boolean;
  canApplyDiscount: boolean;
  canCancelOrder: boolean;
  canDeleteItem: boolean;
  canEditQuantity: boolean;
  canViewAuditLog: boolean;
  canManageUsers: boolean;
  canViewKitchen: boolean;
  canManageMenu: boolean;
  canViewReports: boolean;
}

// ============================================
// Order Types
// ============================================
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  nameEn?: string;
  quantity: number;
  price: number;
  notes?: string;
  category: MenuCategory;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'paid'
  | 'cancelled';

export interface Order {
  id: string;
  tableId: number | null;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  tax?: number;
  taxPercent?: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  paidAt?: number;
  paymentMethod?: 'cash' | 'card' | 'online';
}

// ============================================
// Menu Types
// ============================================
export type MenuCategory =
  | 'baked_potato'
  | 'italian_plate'
  | 'burger'
  | 'pizza'
  | 'cold_coffee'
  | 'hot_coffee'
  | 'drip_coffee'
  | 'hot_bar'
  | 'tea'
  | 'frappe'
  | 'shake_bar'
  | 'mojito'
  | 'cake_dessert';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: MenuCategory;
  price: number;
  description?: string;
  image?: string;
  available: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface MenuCategoryData {
  id: MenuCategory;
  name: string;
  icon: string;
  sortOrder: number;
}

// ============================================
// Takeaway Order Types
// ============================================
export type TakeawayOrderType = 'phone' | 'snapfood' | 'snapp' | 'tourbon' | 'other';

export interface TakeawayOrder {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  tax?: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  customerName?: string;
  customerPhone?: string;
  address: string;
  orderType: TakeawayOrderType;
  notes?: string;
  paidAt?: number;
}

// ============================================
// Audit Log Types
// ============================================
export type AuditActionType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'order'
  | 'order_update'
  | 'order_paid'
  | 'order_cancelled'
  | 'discount'
  | 'status'
  | 'table_create'
  | 'table_update'
  | 'table_delete'
  | 'menu_create'
  | 'menu_update'
  | 'menu_delete'
  | 'user_create'
  | 'user_update'
  | 'user_delete';

export interface AuditEntry {
  id: string;
  userId: number;
  userName: string;
  userRole: UserRole;
  action: string;
  actionType: AuditActionType;
  details: Record<string, unknown>;
  tableId?: number;
  orderId?: string;
  timestamp: number;
}

// ============================================
// Real-time Sync Types
// ============================================
export type SyncMessageType =
  | 'table_update'
  | 'order_update'
  | 'takeaway_update'
  | 'auth_update'
  | 'full_sync';

export interface SyncMessage {
  type: SyncMessageType;
  payload: unknown;
  sourceTabId: string;
  timestamp: number;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Form Types
// ============================================
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface OrderFormData {
  tableId?: number;
  items: OrderItem[];
  discountPercent?: number;
}

export interface TakeawayFormData {
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  address: string;
  orderType: TakeawayOrderType;
  notes?: string;
  discountPercent?: number;
}

// ============================================
// Floor Configuration Types
// ============================================
export interface FloorConfig {
  id: TableFloor;
  name: string;
  width: number;
  depth: number;
}

export interface SpecialArea {
  id: string;
  type: 'barista' | 'kitchen' | 'counter';
  position: { x: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  description: string;
}

// ============================================
// Statistics Types
// ============================================
export interface DailyStats {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { itemId: string; name: string; quantity: number }[];
}

export interface TableStats {
  tableId: number;
  totalOrders: number;
  totalRevenue: number;
  averageDuration: number;
  utilizationPercent: number;
}
