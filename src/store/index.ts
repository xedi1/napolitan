/**
 * Zustand Store
 * Central state management for Cafe Napolitan
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserRole,
  Table,
  TableStatus,
  TableFloor,
  Order,
  OrderItem,
  TakeawayOrder,
  AuditEntry,
  MenuItem,
  RolePermissions,
  MenuCategory,
} from '@/types';
import { generateId, calculateOrderTotal } from '@/lib/utils';

// ============================================
// Store Version & Migration
// ============================================
const STORE_VERSION = 4; // Bumped to clear old corrupted localStorage

// Schema version for localStorage migration
interface PersistVersion {
  _version?: number;
}

// Migration function - resets state when version changes
function migrateStore<T extends PersistVersion>(version: number): (state: T) => Partial<T> {
  return (state: T) => {
    // If version matches or is higher, no migration needed
    if ((state._version ?? 1) >= version) {
      return {};
    }
    // Version mismatch - force reset to defaults
    // This clears old corrupted data from previous crashes
    console.warn(`[Store] Schema version mismatch (${state._version} -> ${version}). Resetting state to clear old data.`);
    
    // Return partial with _version set to clear all persisted data
    return {
      _version: version,
    } as Partial<T>;
  };
}

// Validate and sanitize table data
function validateTables(tables: unknown): Table[] {
  if (!Array.isArray(tables)) return DEFAULT_TABLES;
  
  const validated: Table[] = [];
  for (const t of tables) {
    // Ensure required fields exist with correct types
    if (
      typeof t.id !== 'number' ||
      !['circle', 'rectangle'].includes(t.shape) ||
      typeof t.seats !== 'number' ||
      !['available', 'occupied', 'preparing', 'awaiting', 'eating', 'reserved', 'cleaning'].includes(t.status) ||
      ![1, 2].includes(t.floor)
    ) {
      continue; // Skip invalid table
    }
    validated.push({
      id: t.id,
      shape: t.shape,
      group: String(t.group || 'main'),
      position: { x: Number(t.position?.x || 0), y: Number(t.position?.y || 0) },
      seats: t.seats,
      status: t.status,
      floor: t.floor,
      currentOrderId: t.currentOrderId,
      lastUpdated: Number(t.lastUpdated || Date.now()),
    });
  }
  return validated.length > 0 ? validated : DEFAULT_TABLES;
}

// Validate and sanitize menu items
function validateMenuItems(items: unknown): MenuItem[] {
  if (!Array.isArray(items)) return DEFAULT_MENU_ITEMS;
  
  const validCategories: MenuCategory[] = [
    'hot_coffee', 'cold_coffee', 'hot_bar', 'tea', 'frappe', 'shake_bar', 'mojito',
    'baked_potato', 'italian_plate', 'burger', 'pizza', 'cake_dessert'
  ];
  
  const validated: MenuItem[] = [];
  for (const item of items) {
    if (
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      !validCategories.includes(item.category) ||
      typeof item.price !== 'number'
    ) {
      continue; // Skip invalid item
    }
    validated.push({
      id: String(item.id),
      name: String(item.name),
      nameEn: String(item.nameEn || ''),
      category: item.category,
      price: Number(item.price),
      description: item.description ? String(item.description) : undefined,
      image: item.image ? String(item.image) : undefined,
      available: Boolean(item.available),
      sortOrder: Number(item.sortOrder || 0),
      createdAt: Number(item.createdAt || Date.now()),
      updatedAt: Number(item.updatedAt || Date.now()),
    });
  }
  return validated.length > 0 ? validated : DEFAULT_MENU_ITEMS;
}

// ============================================
// Role Permissions
// ============================================
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
    canViewReports: true,
  },
  kitchen: {
    canTakeOrder: true,
    canViewTables: true,
    canUpdateStatus: true,
    canApplyDiscount: false,
    canCancelOrder: false,
    canDeleteItem: false,
    canEditQuantity: false,
    canViewAuditLog: false,
    canManageUsers: false,
    canViewKitchen: true,
    canManageMenu: false,
    canViewReports: false,
  },
  waiter: {
    canTakeOrder: true,
    canViewTables: true,
    canUpdateStatus: true,
    canApplyDiscount: false,
    canCancelOrder: true,
    canDeleteItem: false,
    canEditQuantity: true,
    canViewAuditLog: false,
    canManageUsers: false,
    canViewKitchen: false,
    canManageMenu: false,
    canViewReports: false,
  },
};

// ============================================
// Auth Store
// ============================================
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loginTime: number | null;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  checkPermission: (permission: keyof RolePermissions) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      loginTime: null,
      
      login: (user: User) => {
        set({
          currentUser: user,
          isAuthenticated: true,
          loginTime: Date.now(),
        });
      },
      
      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          loginTime: null,
        });
      },
      
      checkPermission: (permission) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return ROLE_PERMISSIONS[currentUser.role]?.[permission] ?? false;
      },
    }),
    {
      name: 'napoli-auth-v2',
    }
  )
);

// ============================================
// UI Store
// ============================================
interface UIState {
  isKitchenView: boolean;
  isTextMode: boolean;
  isAuditPanelOpen: boolean;
  isMenuManagementOpen: boolean;
  isTakeawayOpen: boolean;
  isUserManagementOpen: boolean;
  selectedFloor: TableFloor;
  
  // Actions
  toggleKitchenView: () => void;
  toggleTextMode: () => void;
  toggleAuditPanel: () => void;
  toggleMenuManagement: () => void;
  toggleTakeaway: () => void;
  toggleUserManagement: () => void;
  setSelectedFloor: (floor: TableFloor) => void;
  closeAllPanels: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isKitchenView: false,
  isTextMode: false,
  isAuditPanelOpen: false,
  isMenuManagementOpen: false,
  isTakeawayOpen: false,
  isUserManagementOpen: false,
  selectedFloor: 1,
  
  toggleKitchenView: () => set((state) => ({ isKitchenView: !state.isKitchenView })),
  toggleTextMode: () => set((state) => ({ isTextMode: !state.isTextMode })),
  toggleAuditPanel: () => set((state) => ({ isAuditPanelOpen: !state.isAuditPanelOpen })),
  toggleMenuManagement: () => set((state) => ({ isMenuManagementOpen: !state.isMenuManagementOpen })),
  toggleTakeaway: () => set((state) => ({ isTakeawayOpen: !state.isTakeawayOpen })),
  toggleUserManagement: () => set((state) => ({ isUserManagementOpen: !state.isUserManagementOpen })),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),
  closeAllPanels: () =>
    set({
      isAuditPanelOpen: false,
      isMenuManagementOpen: false,
      isUserManagementOpen: false,
    }),
}));

// ============================================
// Default Table Data (Cloudflare Pages compatible - no API needed)
// ============================================
const DEFAULT_TABLES: Table[] = [
  // Floor 1
  { id: 1, shape: 'circle' as const, group: 'main', position: { x: 0, y: 0 }, seats: 4, status: 'available' as const, floor: 1 as TableFloor, lastUpdated: Date.now() },
  { id: 2, shape: 'circle' as const, group: 'main', position: { x: 1, y: 0 }, seats: 4, status: 'available' as const, floor: 1 as TableFloor, lastUpdated: Date.now() },
  { id: 3, shape: 'rectangle' as const, group: 'main', position: { x: 2, y: 0 }, seats: 6, status: 'available' as const, floor: 1 as TableFloor, lastUpdated: Date.now() },
  { id: 4, shape: 'circle' as const, group: 'window', position: { x: 0, y: 1 }, seats: 2, status: 'available' as const, floor: 1 as TableFloor, lastUpdated: Date.now() },
  { id: 5, shape: 'circle' as const, group: 'window', position: { x: 1, y: 1 }, seats: 2, status: 'available' as const, floor: 1 as TableFloor, lastUpdated: Date.now() },
  // Floor 2
  { id: 6, shape: 'rectangle' as const, group: 'vip', position: { x: 0, y: 0 }, seats: 8, status: 'available' as const, floor: 2 as TableFloor, lastUpdated: Date.now() },
  { id: 7, shape: 'circle' as const, group: 'vip', position: { x: 1, y: 0 }, seats: 4, status: 'available' as const, floor: 2 as TableFloor, lastUpdated: Date.now() },
  { id: 8, shape: 'circle' as const, group: 'vip', position: { x: 2, y: 0 }, seats: 4, status: 'available' as const, floor: 2 as TableFloor, lastUpdated: Date.now() },
];

// ============================================
// Table Store
// ============================================
interface TableState {
  tables: Table[];
  selectedTableId: number | null;
  isLoading: boolean;
  
  // Actions
  setTables: (tables: Table[]) => void;
  selectTable: (id: number | null) => void;
  updateTableStatus: (id: number, status: TableStatus) => void;
  updateTable: (id: number, updates: Partial<Table>) => void;
  addTable: (table: Omit<Table, 'id' | 'lastUpdated'>) => void;
  removeTable: (id: number) => void;
  loadTables: () => Promise<void>;
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: DEFAULT_TABLES, // Use default data for Cloudflare Pages
      selectedTableId: null,
      isLoading: false,
      
      setTables: (tables) => set({ tables }),
      
      selectTable: (id) => set({ selectedTableId: id }),
      
      updateTableStatus: (id, status) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, status, lastUpdated: Date.now() } : t
          ),
        })),
      
      updateTable: (id, updates) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, ...updates, lastUpdated: Date.now() } : t
          ),
        })),
      
      addTable: (table) =>
        set((state) => ({
          tables: [
            ...state.tables,
            {
              ...table,
              id: Math.max(...state.tables.map((t) => t.id), 0) + 1,
              lastUpdated: Date.now(),
            },
          ],
        })),
      
      removeTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== id),
          selectedTableId: state.selectedTableId === id ? null : state.selectedTableId,
        })),
      
      // Cloudflare Pages compatible - no API call, use default data
      loadTables: async () => {
        set({ isLoading: true });
        // For Cloudflare Pages, we use default data since API routes don't work
        // The persisted state will already have data from localStorage
        const { tables } = get();
        if (tables.length === 0) {
          set({ tables: DEFAULT_TABLES });
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'napoli-tables-v3',
      version: STORE_VERSION,
      onRehydrateStorage: () => (state) => {
        // Validate and sanitize on rehydration
        if (state) {
          const validated = validateTables(state.tables);
          if (validated.length !== state.tables.length || !Array.isArray(state.tables)) {
            console.warn('[TableStore] Data validation triggered - resetting to defaults');
            state.tables = validated.length > 0 ? validated : DEFAULT_TABLES;
          }
        }
      },
      partialize: (state) => ({
        tables: validateTables(state.tables),
        selectedTableId: state.selectedTableId,
      }),
    }
  )
);

// ============================================
// Order Store
// ============================================
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  
  // Actions
  setOrders: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  createOrder: (tableId: number, items: OrderItem[], createdBy: number) => Order;
  addItemToOrder: (item: Omit<OrderItem, 'id'>) => void;
  removeItemFromOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  applyDiscount: (orderId: string, discountPercent: number) => void;
  completePayment: (orderId: string, paymentMethod: Order['paymentMethod']) => void;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      
      setOrders: (orders) => set({ orders }),
      
      setCurrentOrder: (order) => set({ currentOrder: order }),
      
      createOrder: (tableId, items, createdBy) => {
        const { subtotal, discount, tax, total } = calculateOrderTotal(items);
        const newOrder: Order = {
          id: generateId('order'),
          tableId,
          items: items.map((item) => ({ ...item, id: generateId('item') })),
          status: 'pending',
          subtotal,
          discount,
          tax,
          total,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy,
        };
        
        set((state) => ({
          orders: [...state.orders, newOrder],
          currentOrder: newOrder,
        }));
        
        return newOrder;
      },
      
      addItemToOrder: (item) =>
        set((state) => {
          if (!state.currentOrder) return state;
          
          const existingItemIndex = state.currentOrder.items.findIndex(
            (i) => i.menuItemId === item.menuItemId
          );
          
          let updatedItems: OrderItem[];
          if (existingItemIndex >= 0) {
            updatedItems = state.currentOrder.items.map((i, idx) =>
              idx === existingItemIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            updatedItems = [
              ...state.currentOrder.items,
              { ...item, id: generateId('item') },
            ];
          }
          
          const { subtotal, discount, tax, total } = calculateOrderTotal(updatedItems);
          
          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal,
              discount,
              tax,
              total,
              updatedAt: Date.now(),
            },
          };
        }),
      
      removeItemFromOrder: (itemId) =>
        set((state) => {
          if (!state.currentOrder) return state;
          
          const updatedItems = state.currentOrder.items.filter((i) => i.id !== itemId);
          const { subtotal, discount, tax, total } = calculateOrderTotal(updatedItems);
          
          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal,
              discount,
              tax,
              total,
              updatedAt: Date.now(),
            },
          };
        }),
      
      updateItemQuantity: (itemId, quantity) =>
        set((state) => {
          if (!state.currentOrder) return state;
          
          if (quantity <= 0) {
            const updatedItems = state.currentOrder.items.filter((i) => i.id !== itemId);
            const { subtotal, discount, tax, total } = calculateOrderTotal(updatedItems);
            return {
              currentOrder: {
                ...state.currentOrder,
                items: updatedItems,
                subtotal,
                discount,
                tax,
                total,
                updatedAt: Date.now(),
              },
            };
          }
          
          const updatedItems = state.currentOrder.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          );
          const { subtotal, discount, tax, total } = calculateOrderTotal(updatedItems);
          
          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal,
              discount,
              tax,
              total,
              updatedAt: Date.now(),
            },
          };
        }),
      
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? { ...state.currentOrder, status, updatedAt: Date.now() }
              : state.currentOrder,
        })),
      
      applyDiscount: (orderId, discountPercent) =>
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const { subtotal, discount, tax, total } = calculateOrderTotal(
              o.items,
              discountPercent,
              o.taxPercent
            );
            return { ...o, discountPercent, discount, tax, total, updatedAt: Date.now() };
          }),
          currentOrder:
            state.currentOrder?.id === orderId
              ? (() => {
                  const { subtotal, discount, tax, total } = calculateOrderTotal(
                    state.currentOrder.items,
                    discountPercent,
                    state.currentOrder.taxPercent
                  );
                  return {
                    ...state.currentOrder,
                    discountPercent,
                    discount,
                    tax,
                    total,
                    updatedAt: Date.now(),
                  };
                })()
              : state.currentOrder,
        })),
      
      completePayment: (orderId, paymentMethod) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'paid' as const, paidAt: Date.now(), paymentMethod, updatedAt: Date.now() }
              : o
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? null
              : state.currentOrder,
        })),
      
      cancelOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' as const, updatedAt: Date.now() } : o
          ),
          currentOrder:
            state.currentOrder?.id === orderId ? null : state.currentOrder,
        })),
    }),
    {
      name: 'napoli-orders-v3',
      version: STORE_VERSION,
      onRehydrateStorage: () => (state) => {
        // Validate orders on rehydration
        if (state && !Array.isArray(state.orders)) {
          console.warn('[OrderStore] Invalid orders data - resetting');
          state.orders = [];
        }
      },
    }
  )
);

// ============================================
// Takeaway Store
// ============================================
interface TakeawayState {
  takeawayOrders: TakeawayOrder[];
  currentTakeaway: TakeawayOrder | null;
  
  // Actions
  setCurrentTakeaway: (takeaway: TakeawayOrder | null) => void;
  addItemToTakeaway: (item: Omit<OrderItem, 'id'>) => void;
  removeItemFromTakeaway: (itemId: string) => void;
  updateTakeawayItemQuantity: (itemId: string, quantity: number) => void;
  createTakeawayOrder: (
    customerInfo: TakeawayOrder['customerName'],
    customerPhone: TakeawayOrder['customerPhone'],
    address: string,
    orderType: TakeawayOrder['orderType'],
    createdBy: number
  ) => TakeawayOrder | null;
  updateTakeawayStatus: (orderId: string, status: TakeawayOrder['status']) => void;
  completeTakeawayPayment: (orderId: string, paymentMethod: TakeawayOrder['paymentMethod']) => void;
}

export const useTakeawayStore = create<TakeawayState>()(
  persist(
    (set, get) => ({
      takeawayOrders: [],
      currentTakeaway: null,
      
      setCurrentTakeaway: (takeaway) => set({ currentTakeaway: takeaway }),
      
      addItemToTakeaway: (item) =>
        set((state) => {
          const existing = state.currentTakeaway?.items.find(
            (i) => i.menuItemId === item.menuItemId
          );
          
          if (!state.currentTakeaway) {
            return {
              currentTakeaway: {
                id: generateId('takeaway'),
                items: [{ ...item, id: generateId('item') }],
                status: 'pending',
                subtotal: item.price * item.quantity,
                total: item.price * item.quantity,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: 0,
                address: '',
                orderType: 'phone',
              },
            };
          }
          
          const items = existing
            ? state.currentTakeaway.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            : [...state.currentTakeaway.items, { ...item, id: generateId('item') }];
          
          const { subtotal, total } = calculateOrderTotal(items);
          
          return {
            currentTakeaway: {
              ...state.currentTakeaway,
              items,
              subtotal,
              total,
              updatedAt: Date.now(),
            },
          };
        }),
      
      removeItemFromTakeaway: (itemId) =>
        set((state) => {
          if (!state.currentTakeaway) return state;
          
          const items = state.currentTakeaway.items.filter((i) => i.id !== itemId);
          
          if (items.length === 0) {
            return { currentTakeaway: null };
          }
          
          const { subtotal, total } = calculateOrderTotal(items);
          
          return {
            currentTakeaway: {
              ...state.currentTakeaway,
              items,
              subtotal,
              total,
              updatedAt: Date.now(),
            },
          };
        }),
      
      updateTakeawayItemQuantity: (itemId, quantity) =>
        set((state) => {
          if (!state.currentTakeaway) return state;
          
          if (quantity <= 0) {
            const items = state.currentTakeaway.items.filter((i) => i.id !== itemId);
            if (items.length === 0) return { currentTakeaway: null };
            const { subtotal, total } = calculateOrderTotal(items);
            return {
              currentTakeaway: { ...state.currentTakeaway, items, subtotal, total, updatedAt: Date.now() },
            };
          }
          
          const items = state.currentTakeaway.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          );
          const { subtotal, total } = calculateOrderTotal(items);
          
          return {
            currentTakeaway: { ...state.currentTakeaway, items, subtotal, total, updatedAt: Date.now() },
          };
        }),
      
      createTakeawayOrder: (customerName, customerPhone, address, orderType, createdBy) => {
        const { currentTakeaway } = get();
        if (!currentTakeaway || currentTakeaway.items.length === 0) return null;
        
        const newTakeaway: TakeawayOrder = {
          ...currentTakeaway,
          id: generateId('takeaway'),
          customerName,
          customerPhone,
          address,
          orderType,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy,
        };
        
        set((state) => ({
          takeawayOrders: [...state.takeawayOrders, newTakeaway],
          currentTakeaway: null,
        }));
        
        return newTakeaway;
      },
      
      updateTakeawayStatus: (orderId, status) =>
        set((state) => ({
          takeawayOrders: state.takeawayOrders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o
          ),
        })),
      
      completeTakeawayPayment: (orderId, paymentMethod) =>
        set((state) => ({
          takeawayOrders: state.takeawayOrders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'paid' as const, paidAt: Date.now(), paymentMethod, updatedAt: Date.now() }
              : o
          ),
        })),
    }),
    {
      name: 'napoli-takeaway-v3',
      version: STORE_VERSION,
      onRehydrateStorage: () => (state) => {
        // Validate takeaway orders on rehydration
        if (state && !Array.isArray(state.takeawayOrders)) {
          console.warn('[TakeawayStore] Invalid data - resetting');
          state.takeawayOrders = [];
          state.currentTakeaway = null;
        }
      },
    }
  )
);

// ============================================
// Default Menu Data (Cloudflare Pages compatible - no API needed)
// ============================================
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Hot Coffee
  { id: 'espresso', name: 'اسپرسو', nameEn: 'Espresso', category: 'hot_coffee', price: 55000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'americano', name: 'آمریکانو', nameEn: 'Americano', category: 'hot_coffee', price: 65000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'latte', name: 'لاته', nameEn: 'Latte', category: 'hot_coffee', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cappuccino', name: 'کاپوچینو', nameEn: 'Cappuccino', category: 'hot_coffee', price: 75000, available: true, sortOrder: 4, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'mocha', name: 'موکا', nameEn: 'Mocha', category: 'hot_coffee', price: 85000, available: true, sortOrder: 5, createdAt: Date.now(), updatedAt: Date.now() },
  // Cold Coffee
  { id: 'iced-latte', name: 'لاته سرد', nameEn: 'Iced Latte', category: 'cold_coffee', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'iced-americano', name: 'آمریکانو سرد', nameEn: 'Iced Americano', category: 'cold_coffee', price: 75000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cold-brew', name: 'کلد برو', nameEn: 'Cold Brew', category: 'cold_coffee', price: 95000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Hot Bar
  { id: 'hot-chocolate', name: 'شکلات داغ', nameEn: 'Hot Chocolate', category: 'hot_bar', price: 75000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'matcha-latte', name: 'ماتچا لاته', nameEn: 'Matcha Latte', category: 'hot_bar', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'chai-latte', name: 'چای لاته', nameEn: 'Chai Latte', category: 'hot_bar', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Tea
  { id: 'black-tea', name: 'چای سیاه', nameEn: 'Black Tea', category: 'tea', price: 35000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'green-tea', name: 'چای سبز', nameEn: 'Green Tea', category: 'tea', price: 40000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'herbal-tea', name: 'دمنوش', nameEn: 'Herbal Tea', category: 'tea', price: 45000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Frappe
  { id: 'mocha-frappe', name: 'موکا فراپه', nameEn: 'Mocha Frappe', category: 'frappe', price: 95000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'caramel-frappe', name: 'کارامل فراپه', nameEn: 'Caramel Frappe', category: 'frappe', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vanilla-frappe', name: 'وانیل فراپه', nameEn: 'Vanilla Frappe', category: 'frappe', price: 90000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Shake Bar
  { id: 'chocolate-shake', name: 'شیک شکلات', nameEn: 'Chocolate Shake', category: 'shake_bar', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vanilla-shake', name: 'شیک وانیل', nameEn: 'Vanilla Shake', category: 'shake_bar', price: 80000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'strawberry-shake', name: 'شیک توت فرنگی', nameEn: 'Strawberry Shake', category: 'shake_bar', price: 90000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Mojito
  { id: 'classic-mojito', name: 'موهیتو کلاسیک', nameEn: 'Classic Mojito', category: 'mojito', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'berry-mojito', name: 'موهیتو توت', nameEn: 'Berry Mojito', category: 'mojito', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  // Baked Potato
  { id: 'baked-potato-cheese', name: 'سیب زمینی پنیری', nameEn: 'Cheese Baked Potato', category: 'baked_potato', price: 125000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'baked-potato-bacon', name: 'سیب زمینی بیکن', nameEn: 'Bacon Baked Potato', category: 'baked_potato', price: 145000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  // Italian Plate
  { id: 'pasta-carbonara', name: 'پاستا کاربونارا', nameEn: 'Pasta Carbonara', category: 'italian_plate', price: 185000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'pasta-bolognese', name: 'پاستا بولونز', nameEn: 'Pasta Bolognese', category: 'italian_plate', price: 175000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'risotto', name: 'ریزوتو', nameEn: 'Risotto', category: 'italian_plate', price: 195000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Burger
  { id: 'classic-burger', name: 'برگر کلاسیک', nameEn: 'Classic Burger', category: 'burger', price: 165000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cheese-burger', name: 'چیزبرگر', nameEn: 'Cheese Burger', category: 'burger', price: 185000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'double-burger', name: 'دبل برگر', nameEn: 'Double Burger', category: 'burger', price: 225000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Pizza
  { id: 'margherita', name: 'پیتزا مارگاریتا', nameEn: 'Margherita Pizza', category: 'pizza', price: 175000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'pepperoni', name: 'پیتزا پپرونی', nameEn: 'Pepperoni Pizza', category: 'pizza', price: 195000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vegetarian', name: 'پیتزا سبزیجات', nameEn: 'Vegetarian Pizza', category: 'pizza', price: 165000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Cake & Dessert
  { id: 'cheesecake', name: 'چیزکیک', nameEn: 'Cheesecake', category: 'cake_dessert', price: 95000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'tiramisu', name: 'تیرامیسو', nameEn: 'Tiramisu', category: 'cake_dessert', price: 105000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'brownie', name: 'براونی', nameEn: 'Brownie', category: 'cake_dessert', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
];

const DEFAULT_CATEGORIES: MenuCategory[] = [
  'hot_coffee', 'cold_coffee', 'hot_bar', 'tea', 'frappe', 'shake_bar', 'mojito',
  'baked_potato', 'italian_plate', 'burger', 'pizza', 'cake_dessert'
];

// ============================================
// Menu Store
// ============================================
interface MenuState {
  items: MenuItem[];
  categories: MenuCategory[];
  isLoading: boolean;
  
  // Actions
  setItems: (items: MenuItem[]) => void;
  setCategories: (categories: MenuCategory[]) => void;
  loadMenu: () => Promise<void>;
  toggleItemAvailability: (itemId: string) => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_MENU_ITEMS, // Use default data for Cloudflare Pages
      categories: DEFAULT_CATEGORIES,
      isLoading: false,
      
      setItems: (items) => set({ items }),
      setCategories: (categories) => set({ categories }),
      
      // Cloudflare Pages compatible - no API call, use default data
      loadMenu: async () => {
        set({ isLoading: true });
        // For Cloudflare Pages, we use default data since API routes don't work
        // The persisted state will already have data from localStorage
        const { items } = get();
        if (items.length === 0) {
          set({ items: DEFAULT_MENU_ITEMS, categories: DEFAULT_CATEGORIES });
        }
        set({ isLoading: false });
      },
      
      toggleItemAvailability: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, available: !item.available } : item
          ),
        })),
    }),
    {
      name: 'napoli-menu-v3',
      version: STORE_VERSION,
      onRehydrateStorage: () => (state) => {
        // Validate and sanitize on rehydration
        if (state) {
          const validatedItems = validateMenuItems(state.items);
          if (validatedItems.length !== state.items.length || !Array.isArray(state.items)) {
            console.warn('[MenuStore] Data validation triggered - resetting to defaults');
            state.items = validatedItems.length > 0 ? validatedItems : DEFAULT_MENU_ITEMS;
            state.categories = DEFAULT_CATEGORIES;
          }
        }
      },
      partialize: (state) => ({
        items: validateMenuItems(state.items),
        categories: state.categories,
      }),
    }
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

export const useAuditStore = create<AuditState>()((set) => ({
  entries: [],
  
  addEntry: (entry) =>
    set((state) => ({
      entries: [
        {
          ...entry,
          id: generateId('audit'),
          timestamp: Date.now(),
        },
        ...state.entries.slice(0, 99), // Keep last 100 entries
      ],
    })),
  
  clearEntries: () => set({ entries: [] }),
}));
