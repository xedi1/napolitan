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
      tables: [],
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
      
      loadTables: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/tables');
          if (response.ok) {
            const data = await response.json();
            set({ tables: data.data || [] });
          }
        } catch (error) {
          console.error('Failed to load tables:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'napoli-tables-v2',
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
      name: 'napoli-orders-v2',
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
      name: 'napoli-takeaway-v2',
    }
  )
);

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
      items: [],
      categories: [],
      isLoading: false,
      
      setItems: (items) => set({ items }),
      setCategories: (categories) => set({ categories }),
      
      loadMenu: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/menu');
          if (response.ok) {
            const data = await response.json();
            set({
              items: data.items || [],
              categories: data.categories || [],
            });
          }
        } catch (error) {
          console.error('Failed to load menu:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      toggleItemAvailability: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, available: !item.available } : item
          ),
        })),
    }),
    {
      name: 'napoli-menu-v2',
      partialize: (state) => ({ items: state.items, categories: state.categories }),
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
