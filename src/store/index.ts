import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table, TableStatus, User, Order, MenuItem, AuditEntry } from '@/types';

// ============================================
// Table Store
// ============================================
interface TableState {
  tables: Table[];
  selectedTableId: number | null;
  setTableStatus: (tableId: number, status: TableStatus) => void;
  selectTable: (tableId: number | null) => void;
  updateTable: (tableId: number, updates: Partial<Table>) => void;
}

export const useTableStore = create<TableState>()(
  persist(
    (set) => ({
      tables: [
        { id: 1, shape: 'circle', group: 'کناری راست', position: { x: 4.5, y: 0 }, seats: 4, status: 'available' },
        { id: 2, shape: 'circle', group: 'کناری چپ', position: { x: -4.5, y: 0 }, seats: 4, status: 'available' },
        { id: 3, shape: 'circle', group: 'پایینی راست', position: { x: 2, y: 4 }, seats: 4, status: 'available' },
        { id: 4, shape: 'circle', group: 'پایینی چپ', position: { x: -2, y: 4 }, seats: 4, status: 'available' },
        { id: 5, shape: 'rectangle', group: 'بالایی راست', position: { x: 2, y: -4 }, seats: 6, status: 'available' },
        { id: 6, shape: 'rectangle', group: 'بالایی چپ', position: { x: -2, y: -4 }, seats: 6, status: 'available' },
      ],
      selectedTableId: null,
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
  login: (pin: string) => boolean;
  logout: () => void;
}

const USERS_DB: Record<string, User> = {
  '1234': { id: 1, name: 'علی محمدی', role: 'manager', pin: '1234' },
  '5678': { id: 2, name: 'مریم احمدی', role: 'supervisor', pin: '5678' },
  '0000': { id: 3, name: 'رضا کریمی', role: 'waiter', pin: '0000' },
};

export const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  waiter: { canTakeOrder: true, canViewTables: true, canUpdateStatus: true, canApplyDiscount: false, canCancelOrder: false, canDeleteItem: false, canViewAuditLog: false, canManageUsers: false },
  supervisor: { canTakeOrder: true, canViewTables: true, canUpdateStatus: true, canApplyDiscount: true, canCancelOrder: true, canDeleteItem: true, canViewAuditLog: true, canManageUsers: false },
  manager: { canTakeOrder: true, canViewTables: true, canUpdateStatus: true, canApplyDiscount: true, canCancelOrder: true, canDeleteItem: true, canViewAuditLog: true, canManageUsers: true },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (pin) => {
        const user = USERS_DB[pin];
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null, isAuthenticated: false }),
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
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      currentOrder: null,
      addOrder: (order) =>
        set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updates, updatedAt: Date.now() } : o
          ),
        })),
      deleteOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),
      setCurrentOrder: (order) => set({ currentOrder: order }),
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
