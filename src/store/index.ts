import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table, TableStatus, User, UserRole, Order, AuditEntry, RolePermissions } from '@/types';
import {
  calculateSubtotal,
  addItemToOrder as calcAddItem,
  removeItemFromOrder as calcRemoveItem,
  updateItemQuantity as calcUpdateQuantity,
  calculateTotal,
  type OrderItem,
} from '@/lib/orderCalculator';

// Helper to convert string ID like "table_1" to number 1
function parseTableId(id: string): number {
  const match = id.match(/table_(\d+)/);
  return match ? parseInt(match[1], 10) : parseInt(id, 10);
}

// Default tables (used before JSON loads or if fetch fails)
const DEFAULT_TABLES: Table[] = [
  { id: 1, shape: 'circle', group: 'کناری راست', position: { x: 3, y: 3 }, seats: 4, status: 'available' },
  { id: 2, shape: 'circle', group: 'کناری چپ', position: { x: -3, y: 3 }, seats: 4, status: 'available' },
  { id: 3, shape: 'circle', group: 'پایینی راست', position: { x: 3, y: 0 }, seats: 4, status: 'available' },
  { id: 4, shape: 'circle', group: 'پایینی چپ', position: { x: -3, y: 0 }, seats: 4, status: 'available' },
];

// ============================================
// Table Store
// ============================================
interface TableTimers {
  preparingTimeout: NodeJS.Timeout | null;
  eatingTimeout: NodeJS.Timeout | null;
}

interface TableState {
  tables: Table[];
  selectedTableId: number | null;
  isLoading: boolean;
  // Auto-status timers managed in store
  statusTimers: Map<number, TableTimers>;
  setTableStatus: (tableId: number, status: TableStatus) => void;
  selectTable: (tableId: number | null) => void;
  updateTable: (tableId: number, updates: Partial<Table>) => void;
  loadTablesFromJSON: () => Promise<void>;
  // Timer management
  setAutoStatusTimer: (tableId: number, preparingCallback: () => void, eatingCallback: () => void) => void;
  clearTableTimers: (tableId: number) => void;
  clearAllTimers: () => void;
}

// Fetch tables from JSON and convert to Table format
async function fetchTablesFromJSON(): Promise<Table[]> {
  try {
    const response = await fetch('/data/tables.json');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    
    return data.tables.map((t: { id: string; shape: string; position: { x: number; z: number }; seats: number; group: string; status: TableStatus }) => ({
      id: parseTableId(t.id),
      shape: t.shape as 'circle' | 'rectangle',
      position: { x: t.position.x, y: t.position.z },
      seats: t.seats,
      group: t.group,
      status: t.status,
    }));
  } catch (error) {
    console.error('Failed to load tables from JSON, using defaults:', error);
    return DEFAULT_TABLES;
  }
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: DEFAULT_TABLES,
      selectedTableId: null,
      isLoading: false,
      statusTimers: new Map(),
      setTableStatus: (tableId, status) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, status, lastUpdated: Date.now() } : t
          ),
        })),
      selectTable: (tableId) => set({ selectedTableId: tableId }),
      updateTable: (tableId, updates) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, ...updates, lastUpdated: Date.now() } : t
          ),
        })),
      loadTablesFromJSON: async () => {
        set({ isLoading: true });
        const tables = await fetchTablesFromJSON();
        set({ tables, isLoading: false });
      },
      setAutoStatusTimer: (tableId, preparingCallback, eatingCallback) => {
        // Clear existing timers for this table first
        get().clearTableTimers(tableId);
        
        // Create new timers
        const timers: TableTimers = {
          preparingTimeout: setTimeout(() => {
            preparingCallback();
          }, 2 * 60 * 1000), // 2 minutes
          eatingTimeout: setTimeout(() => {
            eatingCallback();
          }, 12 * 60 * 1000), // 12 minutes
        };
        
        // Store in map
        const newTimers = new Map(get().statusTimers);
        newTimers.set(tableId, timers);
        set({ statusTimers: newTimers });
      },
      clearTableTimers: (tableId) => {
        const timers = get().statusTimers.get(tableId);
        if (timers) {
          if (timers.preparingTimeout) clearTimeout(timers.preparingTimeout);
          if (timers.eatingTimeout) clearTimeout(timers.eatingTimeout);
          const newTimers = new Map(get().statusTimers);
          newTimers.delete(tableId);
          set({ statusTimers: newTimers });
        }
      },
      clearAllTimers: () => {
        const timers = get().statusTimers;
        timers.forEach((timer) => {
          if (timer.preparingTimeout) clearTimeout(timer.preparingTimeout);
          if (timer.eatingTimeout) clearTimeout(timer.eatingTimeout);
        });
        set({ statusTimers: new Map() });
      },
    }),
    { name: 'napoli-tables' }
  )
);

// ============================================
// Auth Store
// ============================================
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  login: (username: string, password: string) => boolean;
  selectRole: (role: UserRole) => void;
  logout: () => void;
}

/**
 * TEMPORARY USER DATABASE - SECURITY NOTE
 * 
 * This is a placeholder authentication system for demonstration purposes only.
 * All passwords are stored in plain text and visible in client-side code.
 * 
 * This is acceptable for this development/demo phase because:
 * 1. No real sensitive data is protected
 * 2. No backend infrastructure exists
 * 
 * When implementing a production version:
 * 1. Move authentication to a secure backend server
 * 2. Hash passwords using bcrypt or similar
 * 3. Use HTTPS in production
 * 4. Implement proper session management with JWT or cookies
 */
const USERS_DB: User[] = [
  { id: 1, username: '09141632302', password: 'napoli.hadi.m', name: 'مدیریت', role: 'manager' },
  { id: 2, username: '09141632302', password: 'napoli.hadi.a', name: 'آشپزخانه', role: 'kitchen' },
  { id: 3, username: '09141632302', password: 'napoli.hadi.g', name: 'گارسون', role: 'waiter' },
];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  manager: {
    canTakeOrder: true,
    canViewTables: true,
    canUpdateStatus: true,
    canApplyDiscount: true,
    canCancelOrder: true,
    canDeleteItem: true,
    canViewAuditLog: true,
    canManageUsers: true,
    canViewKitchen: true,
    canManageMenu: true,
  },
  kitchen: {
    canTakeOrder: false,
    canViewTables: false,
    canUpdateStatus: false,
    canApplyDiscount: false,
    canCancelOrder: false,
    canDeleteItem: false,
    canViewAuditLog: false,
    canManageUsers: false,
    canViewKitchen: true,
    canManageMenu: false,
  },
  waiter: {
    canTakeOrder: true,
    canViewTables: true,
    canUpdateStatus: true,
    canApplyDiscount: false,
    canCancelOrder: false,
    canDeleteItem: false,
    canViewAuditLog: false,
    canManageUsers: false,
    canViewKitchen: false,
    canManageMenu: false,
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      selectedRole: null,
      login: (username, password) => {
        const user = USERS_DB.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user, isAuthenticated: true, selectedRole: user.role });
          return true;
        }
        return false;
      },
      selectRole: (role) => set({ selectedRole: role }),
      logout: () => set({ currentUser: null, isAuthenticated: false, selectedRole: null }),
    }),
    { name: 'napoli-auth' }
  )
);

// ============================================
// Order Store
// ============================================
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  setCurrentOrder: (order: Order | null) => void;
  // Complete payment - marks order as paid and optionally clears table
  completePayment: (orderId: string, tableId: number) => void;
  // Connected order operations using orderCalculator
  addItemToCurrentOrder: (menuItem: { menuItemId: string; name: string; price: number; quantity?: number }) => void;
  removeItemFromCurrentOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      addOrder: (order) =>
        set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updates, updatedAt: Date.now() } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, ...updates, updatedAt: Date.now() }
            : state.currentOrder,
        })),
      deleteOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
          currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        })),
      setCurrentOrder: (order) => set({ currentOrder: order }),
      completePayment: (orderId, tableId) => {
        // Get the table store to update table status
        const { setTableStatus, clearTableTimers } = useTableStore.getState();
        const { addEntry } = useAuditStore.getState();
        const { currentUser } = useAuthStore.getState();
        
        // Clear any existing timers for this table
        clearTableTimers(tableId);
        
        // Update order status to 'paid'
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'paid' as const, updatedAt: Date.now() } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'paid' as const, updatedAt: Date.now() }
            : null, // Clear current order after payment
        }));
        
        // Set table status to 'available' after payment
        setTableStatus(tableId, 'available');
        
        // Log the payment completion
        addEntry({
          userId: currentUser?.id || 0,
          userName: currentUser?.name || 'سیستم',
          userRole: currentUser?.role || 'waiter',
          action: 'تکمیل پرداخت',
          actionType: 'order',
          details: `پرداخت میز ${tableId} با موفقیت انجام شد`,
          tableId: tableId,
        });
      },
      addItemToCurrentOrder: (menuItem) => {
        const { currentOrder } = get();
        if (!currentOrder) return;

        const newItem: Omit<OrderItem, 'id'> = {
          menuItemId: menuItem.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: menuItem.quantity || 1,
        };

        const updatedOrder = calcAddItem(currentOrder, newItem);
        set((state) => ({
          currentOrder: updatedOrder,
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? updatedOrder : o
          ),
        }));
      },
      removeItemFromCurrentOrder: (itemId) => {
        const { currentOrder } = get();
        if (!currentOrder) return;

        const updatedOrder = calcRemoveItem(currentOrder, itemId);
        set((state) => ({
          currentOrder: updatedOrder,
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? updatedOrder : o
          ),
        }));
      },
      updateItemQuantity: (itemId, quantity) => {
        const { currentOrder } = get();
        if (!currentOrder) return;

        const updatedOrder = calcUpdateQuantity(currentOrder, itemId, quantity);
        set((state) => ({
          currentOrder: updatedOrder,
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? updatedOrder : o
          ),
        }));
      },
      clearCurrentOrder: () => {
        const { currentOrder } = get();
        if (!currentOrder) return;
        set({ currentOrder: { ...currentOrder, items: [], subtotal: 0, total: 0 } });
      },
    }),
    { name: 'napoli-orders' }
  )
);

// ============================================
// Audit Store
// ============================================
interface AuditState {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearEntries: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
            },
            ...state.entries,
          ].slice(0, 100),
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: 'napoli-audit' }
  )
);

// ============================================
// UI Store
// ============================================
interface UIState {
  isTextMode: boolean;
  isAuditPanelOpen: boolean;
  toggleTextMode: () => void;
  toggleAuditPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTextMode: false,
  isAuditPanelOpen: false,
  toggleTextMode: () => set((state) => ({ isTextMode: !state.isTextMode })),
  toggleAuditPanel: () => set((state) => ({ isAuditPanelOpen: !state.isAuditPanelOpen })),
}));
