// Table Types
export type TableShape = 'circle' | 'rectangle';
export type TableStatus = 
  | 'available' 
  | 'occupied' 
  | 'preparing' 
  | 'awaiting' 
  | 'reserved' 
  | 'cleaning';

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
  currentOrder?: string;
  lastUpdated?: number;
}

// User & Auth Types
export type UserRole = 'manager' | 'supervisor' | 'waiter';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  pin: string;
}

export interface RolePermissions {
  canTakeOrder: boolean;
  canViewTables: boolean;
  canUpdateStatus: boolean;
  canApplyDiscount: boolean;
  canCancelOrder: boolean;
  canDeleteItem: boolean;
  canViewAuditLog: boolean;
  canManageUsers: boolean;
}

// Order Types
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
  subtotal: number;
  discount?: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

// Menu Types
export interface MenuItem {
  id: string;
  name: string;
  nameFa: string;
  category: 'coffee' | 'tea' | 'dessert' | 'food';
  price: number;
  description?: string;
  image?: string;
  available: boolean;
}

// Audit Log Types
export type AuditActionType = 'delete' | 'discount' | 'cancel' | 'order' | 'login' | 'logout' | 'status';

export interface AuditEntry {
  id: string;
  userId: number;
  userName: string;
  userRole: UserRole;
  action: string;
  actionType: AuditActionType;
  details: string;
  tableId?: number;
  timestamp: number;
}

// Real-time Sync Types
export interface SyncMessage {
  type: 'table_update' | 'order_update' | 'user_presence' | 'sync_state';
  payload: unknown;
  userId: number;
  timestamp: number;
}

// WebSocket Events
export interface WSEvent {
  event: string;
  data: unknown;
}
