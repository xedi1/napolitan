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
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      selectedRole: null,
      login: (username, password) => {
        const user = USERS_DB.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user, isAuthenticated: true, selectedRole: user.role });
          // Broadcast to other tabs
          if (typeof window !== 'undefined') {
            getSync().broadcast('AUTH_UPDATE', 'auth', get());
          }
          return true;
        }
        return false;
      },
      selectRole: (role) => {
        set({ selectedRole: role });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('AUTH_UPDATE', 'auth', get());
        }
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false, selectedRole: null });
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          getSync().broadcast('AUTH_UPDATE', 'auth', get());
        }
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
      
      const authState = message.payload as { currentUser: User | null; isAuthenticated: boolean; selectedRole: UserRole | null };
      if (!authState) return;
      
      const current = useAuthStore.getState();
      // Only update if different
      if (JSON.stringify(current) !== JSON.stringify(authState)) {
        useAuthStore.setState({
          currentUser: authState.currentUser ?? null,
          isAuthenticated: authState.isAuthenticated ?? false,
          selectedRole: authState.selectedRole ?? null,
        });
      }
    });
    
    sync.subscribe('FULL_SYNC', (message: SyncMessage) => {
      if (message.sourceTabId === sync.getTabId()) return;
      
      const state = message.payload as { auth?: { currentUser: User | null; isAuthenticated: boolean; selectedRole: UserRole | null } };
      if (state.auth) {
        const current = useAuthStore.getState();
        if (JSON.stringify(current) !== JSON.stringify(state.auth)) {
          useAuthStore.setState({
            currentUser: state.auth.currentUser ?? null,
            isAuthenticated: state.auth.isAuthenticated ?? false,
            selectedRole: state.auth.selectedRole ?? null,
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
  // Connected order operations using orderCalculator
  addItemToCurrentOrder: (menuItem: { menuItemId: string; name: string; price: number; quantity?: number; category?: string }) => void;
  removeItemFromCurrentOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCurrentOrder: () => void;
}

// Helper to determine barType from items
function determineBarType(items: OrderItem[], menuItems: { id: string; category: string }[]): 'cold' | 'hot' | undefined {
  // Kitchen sees everything except pure coffee
  // If any item is cold drink (not coffee), barType = 'cold'
  // If any item is food or dessert (hot bar), barType = 'hot'
  const coldCategories = ['cold'];
  const hotCategories = ['dessert', 'food'];
  
  for (const item of items) {
    const menuItem = menuItems.find(m => m.id === item.menuItemId);
    if (menuItem) {
      if (coldCategories.includes(menuItem.category)) return 'cold';
      if (hotCategories.includes(menuItem.category)) return 'hot';
    }
  }
  return undefined;
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
        
        // Determine barType based on all items in the order
        // Menu categories: coffee, cold, dessert, food
        // Kitchen sees: cold drinks, desserts, food (not pure coffee)
        const allItems = [...currentOrder.items, { ...newItem, id: `temp-${Date.now()}` }];
        const menuCategoryMap = [
          { id: 'espresso', category: 'coffee' },
          { id: 'latte', category: 'coffee' },
          { id: 'americano', category: 'coffee' },
          { id: 'cappuccino', category: 'coffee' },
          { id: 'mocha', category: 'coffee' },
          { id: 'tea', category: 'coffee' },
          { id: 'mojito', category: 'cold' },
          { id: 'iced_latte', category: 'cold' },
          { id: 'cheesecake', category: 'dessert' },
          { id: 'tiramisu', category: 'dessert' },
          { id: 'brownie', category: 'dessert' },
          { id: 'burger', category: 'food' },
          { id: 'pizza', category: 'food' },
          { id: 'fries', category: 'food' },
          { id: 'salad', category: 'food' },
        ];
        
        const newBarType = determineBarType(
          allItems as OrderItem[], 
          menuItem.category ? [...menuCategoryMap, { id: menuItem.menuItemId, category: menuItem.category }] : menuCategoryMap
        );
        
        // Update barType if determined
        if (newBarType) {
          updatedOrder.barType = newBarType;
        }
        
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
        
        // Recalculate barType after removal
        const menuCategoryMap = [
          { id: 'espresso', category: 'coffee' },
          { id: 'latte', category: 'coffee' },
          { id: 'americano', category: 'coffee' },
          { id: 'cappuccino', category: 'coffee' },
          { id: 'mocha', category: 'coffee' },
          { id: 'tea', category: 'coffee' },
          { id: 'mojito', category: 'cold' },
          { id: 'iced_latte', category: 'cold' },
          { id: 'cheesecake', category: 'dessert' },
          { id: 'tiramisu', category: 'dessert' },
          { id: 'brownie', category: 'dessert' },
          { id: 'burger', category: 'food' },
          { id: 'pizza', category: 'food' },
          { id: 'fries', category: 'food' },
          { id: 'salad', category: 'food' },
        ];
        const newBarType = determineBarType(updatedOrder.items, menuCategoryMap);
        updatedOrder.barType = newBarType;
        
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
        set({ currentOrder: { ...currentOrder, items: [], subtotal: 0, total: 0, barType: undefined } });
        
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
