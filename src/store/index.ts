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
import { getSync, type SyncMessage } from '@/lib/sync';

// Import showToast for user feedback
// Using dynamic import to avoid SSR issues
function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    import('@/components/ToastContainer').then(({ showToast }) => {
      showToast(message, type);
    });
  }
}

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
      setTableStatus: (tableId, status) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, status, lastUpdated: Date.now() } : t
          ),
        }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          const sync = getSync();
          sync.broadcast('TABLE_UPDATE', 'tables', get().tables);
        }
      },
      selectTable: (tableId) => set({ selectedTableId: tableId }),
      updateTable: (tableId, updates) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, ...updates, lastUpdated: Date.now() } : t
          ),
        }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          const sync = getSync();
          sync.broadcast('TABLE_UPDATE', 'tables', get().tables);
        }
      },
      loadTablesFromJSON: async () => {
        set({ isLoading: true });
        const tables = await fetchTablesFromJSON();
        set({ tables, isLoading: false });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          const sync = getSync();
          sync.broadcast('TABLE_UPDATE', 'tables', get().tables);
        }
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

// Subscribe to sync updates for tables (called once at module load)
if (typeof window !== 'undefined') {
  // Delay to ensure sync is initialized
  setTimeout(() => {
    const sync = getSync();
    
    // Listen for table updates from other tabs
    sync.subscribe('TABLE_UPDATE', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return; // Ignore self
      
      const tables = message.payload as Table[];
      if (!tables || !Array.isArray(tables)) return;
      
      const currentTables = useTableStore.getState().tables;
      // Only update if different to avoid unnecessary re-renders
      if (JSON.stringify(currentTables) !== JSON.stringify(tables)) {
        useTableStore.setState({ tables });
      }
    });
    
    // Also listen for FULL_SYNC and update if we have less data
    sync.subscribe('FULL_SYNC', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const state = message.payload as { tables?: Table[] };
      if (state.tables && Array.isArray(state.tables)) {
        const currentTables = useTableStore.getState().tables;
        // Take the one with more data or the remote one if we're empty
        if (currentTables.length === 0 || state.tables.length > currentTables.length) {
          useTableStore.setState({ tables: state.tables });
        }
      }
    });
  }, 100);
}

// ============================================
// Auth Store
// ============================================

// Session duration: 8 hours in milliseconds
const SESSION_DURATION = 8 * 60 * 60 * 1000;

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loginTime: number | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  checkSession: () => boolean;
}

/**
 * ⚠️ SECURITY WARNING - DEMO ONLY ⚠️
 * 
 * This is a placeholder authentication system for demonstration purposes only.
 * Credentials are obfuscated with base64 to prevent casual viewing, but this
 * is NOT secure. Anyone with browser DevTools can decode them.
 * 
 * NEVER use this in production with real user data.
 * 
 * Required for production:
 * 1. Implement a secure backend with proper authentication
 * 2. Hash passwords with bcrypt/argon2
 * 3. Use HTTPS and secure session management
 * 4. Implement rate limiting to prevent brute force
 */

// Simple base64 obfuscation - NOT real encryption
// Decode to view: atob("...") in browser console
const b64 = (str: string) => btoa(str);
const d64 = (str: string) => atob(str);

const USERS_DB: User[] = [
  { id: 1, username: d64('MDkxNDE2MzIzMDI='), password: d64('bmFwb2xpLmhhZGkubQ=='), name: 'مدیریت', role: 'manager' },
  { id: 2, username: d64('MDkxNDE2MzIzMDI='), password: d64('bmFwb2xpLmhhZGkuYQ=='), name: 'آشپزخانه', role: 'kitchen' },
  { id: 3, username: d64('MDkxNDE2MzIzMDI='), password: d64('bmFwb2xpLmhhZGkuZw=='), name: 'گارسون', role: 'waiter' },
];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  manager: {
    canTakeOrder: true,
    canViewTables: true,
    canUpdateStatus: true,
    canApplyDiscount: true,
    canCancelOrder: true,
    canDeleteItem: true,
    canEditQuantity: true,
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
    canEditQuantity: false,
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
    canEditQuantity: true, // Waiter can edit quantity but cannot delete entire item
    canViewAuditLog: false,
    canManageUsers: false,
    canViewKitchen: false,
    canManageMenu: false,
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      loginTime: null,
      login: (username, password) => {
        const user = USERS_DB.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user, isAuthenticated: true, loginTime: Date.now() });
          // Broadcast to other tabs
          if (typeof window !== 'undefined') {
            getSync().broadcast('AUTH_UPDATE', 'auth', get());
          }
          return true;
        }
        return false;
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false, loginTime: null });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('AUTH_UPDATE', 'auth', get());
        }
      },
      checkSession: () => {
        const { loginTime, isAuthenticated } = get();
        if (!isAuthenticated || !loginTime) return false;
        
        const elapsed = Date.now() - loginTime;
        if (elapsed > SESSION_DURATION) {
          // Session expired - logout
          get().logout();
          return false;
        }
        return true;
      },
    }),
    { name: 'napoli-auth' }
  )
);

// Subscribe to sync updates for auth
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const sync = getSync();
    
    sync.subscribe('AUTH_UPDATE', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const authState = message.payload as { currentUser: User | null; isAuthenticated: boolean; loginTime: number | null };
      if (!authState) return;
      
      const current = useAuthStore.getState();
      // Only update if different
      if (JSON.stringify(current) !== JSON.stringify(authState)) {
        useAuthStore.setState({
          currentUser: authState.currentUser ?? null,
          isAuthenticated: authState.isAuthenticated ?? false,
          loginTime: authState.loginTime ?? null,
        });
      }
    });
    
    sync.subscribe('FULL_SYNC', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const state = message.payload as { auth?: { currentUser: User | null; isAuthenticated: boolean; loginTime: number | null } };
      if (state.auth) {
        const current = useAuthStore.getState();
        if (JSON.stringify(current) !== JSON.stringify(state.auth)) {
          useAuthStore.setState({
            currentUser: state.auth.currentUser ?? null,
            isAuthenticated: state.auth.isAuthenticated ?? false,
            loginTime: state.auth.loginTime ?? null,
          });
        }
      }
    });
  }, 100);
}

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
  // Apply discount to current order
  applyDiscount: (discountPercent: number) => void;
  // Cancel current order (sets status to cancelled)
  cancelOrder: (orderId: string, tableId: number) => void;
  // Connected order operations using orderCalculator
  addItemToCurrentOrder: (menuItem: { menuItemId: string; name: string; price: number; quantity?: number; category?: string }) => void;
  removeItemFromCurrentOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      addOrder: (order) => {
        set((state) => ({ orders: [...state.orders, order] }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
      updateOrder: (orderId, updates) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updates, updatedAt: Date.now() } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, ...updates, updatedAt: Date.now() }
            : state.currentOrder,
        }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
      deleteOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
          currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
      setCurrentOrder: (order) => {
        set({ currentOrder: order });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
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
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
        
        // Show toast notification
        toast(`پرداخت میز ${tableId} با موفقیت انجام شد`, 'success');
      },
      applyDiscount: (discountPercent) => {
        const { currentOrder } = get();
        if (!currentOrder) return;
        
        // Calculate discount amount
        const discountAmount = Math.round(currentOrder.subtotal * (discountPercent / 100));
        const newTotal = currentOrder.subtotal - discountAmount + (currentOrder.tax || 0);
        
        const updatedOrder = {
          ...currentOrder,
          discount: discountAmount,
          discountPercent: discountPercent,
          total: newTotal,
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          currentOrder: updatedOrder,
          orders: state.orders.map((o) =>
            o.id === currentOrder.id ? updatedOrder : o
          ),
        }));
        
        // Log discount
        const { addEntry } = useAuditStore.getState();
        const { currentUser } = useAuthStore.getState();
        addEntry({
          userId: currentUser?.id || 0,
          userName: currentUser?.name || 'سیستم',
          userRole: currentUser?.role || 'manager',
          action: 'تخفیف',
          actionType: 'discount',
          details: `${discountPercent}% تخفیف روی سفارش میز ${currentOrder.tableId}`,
          tableId: currentOrder.tableId,
        });
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
        
        // Show toast notification
        toast(`${discountPercent}% تخفیف اعمال شد`, 'success');
      },
      cancelOrder: (orderId, tableId) => {
        const { clearTableTimers } = useTableStore.getState();
        const { addEntry } = useAuditStore.getState();
        const { currentUser } = useAuthStore.getState();
        
        // Clear any existing timers for this table
        clearTableTimers(tableId);
        
        // Update order status to cancelled
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' as const, updatedAt: Date.now() } : o
          ),
          currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        }));
        
        // Set table status back to available
        const { setTableStatus } = useTableStore.getState();
        setTableStatus(tableId, 'available');
        
        // Log cancellation
        addEntry({
          userId: currentUser?.id || 0,
          userName: currentUser?.name || 'سیستم',
          userRole: currentUser?.role || 'manager',
          action: 'لغو سفارش',
          actionType: 'cancel',
          details: `سفارش میز ${tableId} لغو شد`,
          tableId: tableId,
        });
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
        
        // Show toast notification
        toast('سفارش لغو شد', 'info');
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
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
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
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
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
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
      clearCurrentOrder: () => {
        const { currentOrder } = get();
        if (!currentOrder) return;
        set({ currentOrder: { ...currentOrder, items: [], subtotal: 0, total: 0 } });
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('ORDER_UPDATE', 'orders', { orders: get().orders, currentOrder: get().currentOrder });
        }
      },
    }),
    { name: 'napoli-orders' }
  )
);

// Subscribe to sync updates for orders
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const sync = getSync();
    
    sync.subscribe('ORDER_UPDATE', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const data = message.payload as { orders: Order[]; currentOrder: Order | null };
      if (!data) return;
      
      const current = useOrderStore.getState();
      // Only update if different
      if (JSON.stringify(current.orders) !== JSON.stringify(data.orders) || 
          JSON.stringify(current.currentOrder) !== JSON.stringify(data.currentOrder)) {
        useOrderStore.setState({ 
          orders: data.orders ?? current.orders,
          currentOrder: data.currentOrder ?? current.currentOrder 
        });
      }
    });
    
    sync.subscribe('FULL_SYNC', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const state = message.payload as { orders?: Order[]; currentOrder?: Order | null };
      if (state.orders) {
        const current = useOrderStore.getState();
        // Merge orders: take union of both arrays (by id)
        const mergedOrders = [...current.orders];
        for (const remoteOrder of state.orders) {
          if (!mergedOrders.find(o => o.id === remoteOrder.id)) {
            mergedOrders.push(remoteOrder);
          } else {
            // If order exists, keep the one with more recent updatedAt
            const idx = mergedOrders.findIndex(o => o.id === remoteOrder.id);
            if (mergedOrders[idx].updatedAt < remoteOrder.updatedAt) {
              mergedOrders[idx] = remoteOrder;
            }
          }
        }
        useOrderStore.setState({ 
          orders: mergedOrders,
          currentOrder: state.currentOrder ?? current.currentOrder 
        });
      }
    });
  }, 100);
}

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
    (set, get) => ({
      entries: [],
      addEntry: (entry) => {
        set((state) => ({
          entries: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
            },
            ...state.entries,
          ].slice(0, 100),
        }));
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('AUDIT_UPDATE', 'audit', get().entries);
        }
      },
      clearEntries: () => {
        set({ entries: [] });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('AUDIT_UPDATE', 'audit', []);
        }
      },
    }),
    { name: 'napoli-audit' }
  )
);

// Subscribe to sync updates for audit
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const sync = getSync();
    
    sync.subscribe('AUDIT_UPDATE', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const entries = message.payload as AuditEntry[];
      if (!entries || !Array.isArray(entries)) return;
      
      const current = useAuditStore.getState().entries;
      // Merge entries from multiple tabs, keep most recent 100
      const merged = [...current];
      for (const entry of entries) {
        if (!merged.find(e => e.id === entry.id)) {
          merged.unshift(entry); // Add at beginning (most recent first)
        }
      }
      // Sort by timestamp descending and keep top 100
      merged.sort((a, b) => b.timestamp - a.timestamp);
      const finalEntries = merged.slice(0, 100);
      
      if (JSON.stringify(current) !== JSON.stringify(finalEntries)) {
        useAuditStore.setState({ entries: finalEntries });
      }
    });
    
    sync.subscribe('FULL_SYNC', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const state = message.payload as { audit?: AuditEntry[] };
      if (state.audit && Array.isArray(state.audit)) {
        const current = useAuditStore.getState().entries;
        // Merge entries
        const merged = [...current];
        for (const entry of state.audit) {
          if (!merged.find(e => e.id === entry.id)) {
            merged.unshift(entry);
          }
        }
        merged.sort((a, b) => b.timestamp - a.timestamp);
        const finalEntries = merged.slice(0, 100);
        
        if (JSON.stringify(current) !== JSON.stringify(finalEntries)) {
          useAuditStore.setState({ entries: finalEntries });
        }
      }
    });
  }, 100);
}

// ============================================
// UI Store
// ============================================
interface UIState {
  isTextMode: boolean;
  isAuditPanelOpen: boolean;
  toggleTextMode: () => void;
  toggleAuditPanel: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isTextMode: false,
  isAuditPanelOpen: false,
  toggleTextMode: () => {
    set((state) => ({ isTextMode: !state.isTextMode }));
    // Broadcast to other tabs
    if (typeof window !== 'undefined') {
      getSync().broadcast('UI_UPDATE', 'ui', get());
    }
  },
  toggleAuditPanel: () => {
    set((state) => ({ isAuditPanelOpen: !state.isAuditPanelOpen }));
    // Broadcast to other tabs
    if (typeof window !== 'undefined') {
      getSync().broadcast('UI_UPDATE', 'ui', get());
    }
  },
}));

// Subscribe to sync updates for UI (optional - UI state is mostly per-tab)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const sync = getSync();
    
    sync.subscribe('UI_UPDATE', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const uiState = message.payload as { isTextMode: boolean; isAuditPanelOpen: boolean };
      if (!uiState) return;
      
      // UI state sync is optional - mainly for isAuditPanelOpen
      const current = useUIStore.getState();
      if (current.isAuditPanelOpen !== uiState.isAuditPanelOpen) {
        useUIStore.setState({ isAuditPanelOpen: uiState.isAuditPanelOpen });
      }
    });
  }, 100);
}
