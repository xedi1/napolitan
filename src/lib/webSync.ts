/**
 * Web Sync Provider
 * Handles real-time synchronization of all data to Supabase
 * 
 * This ensures ALL devices see the SAME data - tables, orders, menu, etc.
 * Data is stored in Supabase and synced via Realtime subscriptions
 */

'use client';

import { create } from 'zustand';
import { supabase } from './supabase/client';
import type { Table, Order, MenuItem, AuditEntry, TableStatus, OrderItem, TakeawayOrderType } from '@/types';
import { generateId, calculateOrderTotal } from './utils';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'https://your-project.supabase.co' && url.startsWith('https://'));
}

// ============================================
// Web Sync Store - Manages sync state
// ============================================
interface WebSyncState {
  isInitialized: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  error: string | null;
  
  // Data version for conflict resolution
  dataVersion: number;
  
  // Actions
  setInitialized: (value: boolean) => void;
  setOnline: (value: boolean) => void;
  setLastSync: (timestamp: number) => void;
  setError: (error: string | null) => void;
  incrementVersion: () => void;
}

export const useWebSyncStore = create<WebSyncState>((set) => ({
  isInitialized: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null,
  error: null,
  dataVersion: 0,
  
  setInitialized: (value) => set({ isInitialized: value }),
  setOnline: (value) => set({ isOnline: value }),
  setLastSync: (timestamp) => set({ lastSyncAt: timestamp }),
  setError: (error) => set({ error }),
  incrementVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
}));

// ============================================
// Web Sync Manager Class
// ============================================
class WebSyncManager {
  private realtimeChannels: Map<string, any> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize web sync - connect to Supabase and subscribe to all tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    console.log('[WebSync] Initializing...');
    
    // Wait for Supabase to be ready
    let retries = 0;
    while (!supabase && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!supabase || !isSupabaseConfigured()) {
      console.log('[WebSync] Supabase not configured - running in local-only mode');
      useWebSyncStore.getState().setInitialized(true);
      return;
    }

    try {
      // Subscribe to tables
      await this.subscribeToTables();
      
      // Subscribe to orders
      await this.subscribeToOrders();
      
      // Subscribe to takeaway orders
      await this.subscribeToTakeawayOrders();
      
      // Subscribe to menu items
      await this.subscribeToMenuItems();
      
      // Subscribe to audit logs
      await this.subscribeToAuditLogs();

      // Set up online/offline listeners
      window.addEventListener('online', () => {
        useWebSyncStore.getState().setOnline(true);
        this.handleOnline();
      });
      window.addEventListener('offline', () => {
        useWebSyncStore.getState().setOnline(false);
      });

      this.isInitialized = true;
      useWebSyncStore.getState().setInitialized(true);
      useWebSyncStore.getState().setLastSync(Date.now());
      console.log('[WebSync] Initialized successfully');
    } catch (error) {
      console.error('[WebSync] Initialization error:', error);
      useWebSyncStore.getState().setError(String(error));
    }
  }

  private handleOnline(): void {
    console.log('[WebSync] Back online - resyncing...');
    // Trigger a full refresh of all data
    this.refreshAllData();
  }

  private async refreshAllData(): Promise<void> {
    if (!supabase) return;
    
    try {
      // Refresh tables
      const { data: tables } = await supabase.from('restaurant_tables').select('*');
      if (tables) {
        const { useTableStore } = await import('@/store');
        useTableStore.getState().setTables(tables.map(this.mapDbTableToTable));
      }

      // Refresh orders
      const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (orders) {
        const { useOrderStore } = await import('@/store');
        useOrderStore.getState().setOrders(orders.map(this.mapDbOrderToOrder));
      }

      // Refresh takeaway orders (unified into orders)
      const { data: takeaway } = await supabase.from('takeaway_orders').select('*').order('created_at', { ascending: false });
      if (takeaway) {
        const { useOrderStore } = await import('@/store');
        const takeawayOrders = takeaway.map((t: any) => this.mapDbTakeawayToOrder(t, true));
        const existingOrders = useOrderStore.getState().orders;
        const newOrders = takeawayOrders.filter((o: Order) => !existingOrders.find(e => e.id === o.id));
        if (newOrders.length > 0) {
          useOrderStore.getState().setOrders([...newOrders, ...existingOrders]);
        }
      }

      // Refresh menu items
      const { data: menuItems } = await supabase.from('menu_items').select('*');
      if (menuItems) {
        const { useMenuStore } = await import('@/store');
        useMenuStore.getState().setItems(menuItems.map(this.mapDbMenuItemToMenuItem));
      }

      useWebSyncStore.getState().setLastSync(Date.now());
      useWebSyncStore.getState().incrementVersion();
    } catch (error) {
      console.error('[WebSync] Refresh error:', error);
    }
  }

  // ============================================
  // Table Sync
  // ============================================
  private async subscribeToTables(): Promise<void> {
    if (!supabase) return;

    const channel = supabase
      .channel('tables-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, async (payload) => {
        console.log('[WebSync] Table change:', payload.eventType, payload);
        
        const { useTableStore } = await import('@/store');
        const store = useTableStore.getState();

        if (payload.eventType === 'INSERT') {
          const newTable = this.mapDbTableToTable(payload.new as any);
          // Check if table already exists
          if (!store.tables.find(t => t.id === newTable.id)) {
            store.setTables([...store.tables, newTable]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTable = this.mapDbTableToTable(payload.new as any);
          store.setTables(store.tables.map(t => t.id === updatedTable.id ? updatedTable : t));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as any).id;
          store.setTables(store.tables.filter(t => t.id !== oldId));
        }

        useWebSyncStore.getState().incrementVersion();
      })
      .subscribe();

    this.realtimeChannels.set('tables', channel);

    // Initial load
    const { data: tables } = await supabase.from('restaurant_tables').select('*');
    if (tables && tables.length > 0) {
      const { useTableStore } = await import('@/store');
      useTableStore.getState().setTables(tables.map(this.mapDbTableToTable));
    }
  }

  async syncTableUpdate(tableId: number, updates: Partial<Table>): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) return;

    const { useTableStore } = await import('@/store');
    const table = useTableStore.getState().tables.find(t => t.id === tableId);
    if (!table) return;

    const dbUpdates = this.mapTableToDbUpdates(updates);
    
    await supabase
      .from('restaurant_tables')
      .update(dbUpdates)
      .eq('id', tableId);
  }

  async syncAddTable(table: Omit<Table, 'id' | 'lastUpdated'>): Promise<number | null> {
    if (!supabase || !isSupabaseConfigured()) {
      // Local mode - generate ID locally
      const { useTableStore } = await import('@/store');
      const store = useTableStore.getState();
      const newId = Math.max(...store.tables.map(t => t.id), 0) + 1;
      store.addTable(table);
      return newId;
    }

    const dbTable = this.mapTableToDb(table);
    
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert(dbTable)
      .select()
      .single();

    if (error) {
      console.error('[WebSync] Error adding table:', error);
      return null;
    }

    return data.id;
  }

  async syncRemoveTable(tableId: number): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      const { useTableStore } = await import('@/store');
      useTableStore.getState().removeTable(tableId);
      return;
    }

    await supabase.from('restaurant_tables').delete().eq('id', tableId);
  }

  // ============================================
  // Order Sync
  // ============================================
  private async subscribeToOrders(): Promise<void> {
    if (!supabase) return;

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        console.log('[WebSync] Order change:', payload.eventType, payload);
        
        const { useOrderStore } = await import('@/store');
        const store = useOrderStore.getState();

        if (payload.eventType === 'INSERT') {
          const newOrder = this.mapDbOrderToOrder(payload.new as any);
          if (!store.orders.find(o => o.id === newOrder.id)) {
            store.setOrders([newOrder, ...store.orders]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = this.mapDbOrderToOrder(payload.new as any);
          store.setOrders(store.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as any).id;
          store.setOrders(store.orders.filter(o => o.id !== oldId));
        }

        useWebSyncStore.getState().incrementVersion();
      })
      .subscribe();

    this.realtimeChannels.set('orders', channel);

    // Initial load
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orders && orders.length > 0) {
      const { useOrderStore } = await import('@/store');
      useOrderStore.getState().setOrders(orders.map(this.mapDbOrderToOrder));
    }
  }

  async syncCreateOrder(tableId: number, items: OrderItem[], createdBy: number): Promise<Order | null> {
    const { subtotal, discount, tax, total } = calculateOrderTotal(items);
    const orderId = generateId('order');
    
    const newOrder: Order = {
      id: orderId,
      tableId,
      orderType: 'table',
      items: items.map(item => ({ ...item, id: generateId('item') })),
      status: 'pending',
      subtotal,
      discount,
      tax,
      total,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy,
    };

    if (supabase && isSupabaseConfigured()) {
      const dbOrder = this.mapOrderToDb(newOrder);
      const { data, error } = await supabase
        .from('orders')
        .insert(dbOrder)
        .select()
        .single();

      if (error) {
        console.error('[WebSync] Error creating order:', error);
      }
    }

    // Add to local store
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().setOrders([newOrder, ...useOrderStore.getState().orders]);
    useOrderStore.getState().setCurrentOrder(newOrder);

    return newOrder;
  }

  async syncUpdateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().updateOrderStatus(orderId, status);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    }
  }

  async syncCompletePayment(orderId: string, paymentMethod: Order['paymentMethod']): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().completePayment(orderId, paymentMethod);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('orders').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
      }).eq('id', orderId);
    }
  }

  async syncApplyDiscount(orderId: string, discountPercent: number): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().applyDiscount(orderId, discountPercent);

    if (supabase && isSupabaseConfigured()) {
      const order = useOrderStore.getState().orders.find(o => o.id === orderId);
      if (order) {
        await supabase.from('orders').update({
          discount_percent: discountPercent,
          discount: order.discount,
          tax: order.tax,
          total: order.total,
        }).eq('id', orderId);
      }
    }
  }

  async syncCancelOrder(orderId: string): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().cancelOrder(orderId);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    }
  }

  // ============================================
  // Takeaway Order Sync - Now unified with Order
  // ============================================
  private async subscribeToTakeawayOrders(): Promise<void> {
    if (!supabase) return;

    // Subscribe to the unified orders table and filter for takeaway orders
    const channel = supabase
      .channel('takeaway-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'takeaway_orders' }, async (payload) => {
        console.log('[WebSync] Takeaway change:', payload.eventType, payload);
        
        const { useOrderStore } = await import('@/store');
        const store = useOrderStore.getState();
        const takeawayOrder = this.mapDbTakeawayToOrder(payload.new as any, true);

        if (payload.eventType === 'INSERT') {
          if (!store.orders.find(o => o.id === takeawayOrder.id)) {
            store.setOrders([takeawayOrder, ...store.orders]);
          }
        } else if (payload.eventType === 'UPDATE') {
          store.setOrders(store.orders.map(o => o.id === takeawayOrder.id ? takeawayOrder : o));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as any).id;
          store.setOrders(store.orders.filter(o => o.id !== oldId));
        }

        useWebSyncStore.getState().incrementVersion();
      })
      .subscribe();

    this.realtimeChannels.set('takeaway', channel);

    // Initial load of takeaway orders
    const { data: takeaway } = await supabase.from('takeaway_orders').select('*').order('created_at', { ascending: false });
    if (takeaway && takeaway.length > 0) {
      const { useOrderStore } = await import('@/store');
      const existingOrders = useOrderStore.getState().orders;
      const takeawayOrders = takeaway
        .map((t: any) => this.mapDbTakeawayToOrder(t, true))
        .filter((o: Order) => !existingOrders.find(e => e.id === o.id));
      if (takeawayOrders.length > 0) {
        useOrderStore.getState().setOrders([...takeawayOrders, ...existingOrders]);
      }
    }
  }

  async syncCreateTakeawayOrder(takeaway: Order): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().setOrders([takeaway, ...useOrderStore.getState().orders]);

    if (supabase && isSupabaseConfigured()) {
      const dbTakeaway = this.mapOrderToDb(takeaway, true);
      await supabase.from('takeaway_orders').insert(dbTakeaway);
    }
  }

  async syncUpdateTakeawayStatus(orderId: string, status: Order['status']): Promise<void> {
    const { useOrderStore } = await import('@/store');
    useOrderStore.getState().updateOrderStatus(orderId, status);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('takeaway_orders').update({ status }).eq('id', orderId);
    }
  }

  // ============================================
  // Menu Item Sync
  // ============================================
  private async subscribeToMenuItems(): Promise<void> {
    if (!supabase) return;

    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async (payload) => {
        console.log('[WebSync] Menu change:', payload.eventType, payload);
        
        const { useMenuStore } = await import('@/store');
        const store = useMenuStore.getState();

        if (payload.eventType === 'INSERT') {
          const newItem = this.mapDbMenuItemToMenuItem(payload.new as any);
          if (!store.items.find(i => i.id === newItem.id)) {
            store.setItems([...store.items, newItem]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = this.mapDbMenuItemToMenuItem(payload.new as any);
          store.setItems(store.items.map(i => i.id === updatedItem.id ? updatedItem : i));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as any).id;
          store.setItems(store.items.filter(i => i.id !== oldId));
        }

        useWebSyncStore.getState().incrementVersion();
      })
      .subscribe();

    this.realtimeChannels.set('menu', channel);

    // Initial load
    const { data: menuItems } = await supabase.from('menu_items').select('*');
    if (menuItems && menuItems.length > 0) {
      const { useMenuStore } = await import('@/store');
      useMenuStore.getState().setItems(menuItems.map(this.mapDbMenuItemToMenuItem));
    }
  }

  async syncToggleMenuItemAvailability(itemId: string): Promise<void> {
    const { useMenuStore } = await import('@/store');
    const item = useMenuStore.getState().items.find(i => i.id === itemId);
    if (!item) return;

    useMenuStore.getState().toggleItemAvailability(itemId);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('menu_items').update({ available: !item.available }).eq('id', itemId);
    }
  }

  async syncUpdateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<void> {
    const { useMenuStore } = await import('@/store');
    useMenuStore.getState().updateItem(itemId, updates);

    if (supabase && isSupabaseConfigured()) {
      const dbUpdates: Record<string, any> = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.nameEn) dbUpdates.name_en = updates.nameEn;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.available !== undefined) dbUpdates.available = updates.available;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      
      await supabase.from('menu_items').update(dbUpdates).eq('id', itemId);
    }
  }

  async syncAddMenuItem(item: MenuItem): Promise<void> {
    const { useMenuStore } = await import('@/store');
    useMenuStore.getState().addItem(item);

    if (supabase && isSupabaseConfigured()) {
      const dbItem = this.mapMenuItemToDb(item);
      await supabase.from('menu_items').insert(dbItem);
    }
  }

  async syncRemoveMenuItem(itemId: string): Promise<void> {
    const { useMenuStore } = await import('@/store');
    useMenuStore.getState().removeItem(itemId);

    if (supabase && isSupabaseConfigured()) {
      await supabase.from('menu_items').delete().eq('id', itemId);
    }
  }

  // ============================================
  // Audit Log Sync
  // ============================================
  private async subscribeToAuditLogs(): Promise<void> {
    if (!supabase) return;

    const channel = supabase
      .channel('audit-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, async (payload) => {
        console.log('[WebSync] Audit log change:', payload);
        
        const { useAuditStore } = await import('@/store');
        const store = useAuditStore.getState();
        const newEntry = this.mapDbAuditToAudit(payload.new as any);

        // Check if entry already exists (avoid duplicates)
        if (!store.entries.find(e => e.id === newEntry.id)) {
          store.addEntryDirectly(newEntry);
        }

        useWebSyncStore.getState().incrementVersion();
      })
      .subscribe();

    this.realtimeChannels.set('audit', channel);

    // Initial load (last 100 entries)
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (auditLogs && auditLogs.length > 0) {
      const { useAuditStore } = await import('@/store');
      const entries = auditLogs.map(this.mapDbAuditToAudit).reverse();
      useAuditStore.getState().setEntries(entries);
    }
  }

  async syncAddAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const { useAuditStore } = await import('@/store');
    useAuditStore.getState().addEntry(entry);

    if (supabase && isSupabaseConfigured()) {
      const dbEntry = this.mapAuditToDb(entry);
      await supabase.from('audit_log').insert(dbEntry);
    }
  }

  // ============================================
  // Database Mapping Functions
  // ============================================
  
  // Table mappings
  private mapDbTableToTable(dbTable: any): Table {
    return {
      id: dbTable.id,
      shape: dbTable.shape,
      group: dbTable.group_name || 'main',
      position: { x: dbTable.position_x || 0, y: dbTable.position_y || 0 },
      seats: dbTable.seats,
      status: dbTable.status as TableStatus,
      floor: dbTable.floor,
      currentOrderId: dbTable.current_order_id,
      lastUpdated: dbTable.last_updated ? new Date(dbTable.last_updated).getTime() : Date.now(),
    };
  }

  private mapTableToDbUpdates(updates: Partial<Table>): Record<string, any> {
    const dbUpdates: Record<string, any> = {};
    if (updates.shape) dbUpdates.shape = updates.shape;
    if (updates.group) dbUpdates.group_name = updates.group;
    if (updates.position) {
      dbUpdates.position_x = updates.position.x;
      dbUpdates.position_y = updates.position.y;
    }
    if (updates.seats !== undefined) dbUpdates.seats = updates.seats;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.floor !== undefined) dbUpdates.floor = updates.floor;
    if (updates.currentOrderId !== undefined) dbUpdates.current_order_id = updates.currentOrderId;
    dbUpdates.last_updated = new Date().toISOString();
    return dbUpdates;
  }

  private mapTableToDb(table: Omit<Table, 'id' | 'lastUpdated'>): Record<string, any> {
    return {
      shape: table.shape,
      group_name: table.group,
      position_x: table.position.x,
      position_y: table.position.y,
      seats: table.seats,
      status: table.status,
      floor: table.floor,
      current_order_id: table.currentOrderId,
      last_updated: new Date().toISOString(),
    };
  }

    // Order mappings (unified for table and takeaway)
  private mapDbOrderToOrder(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id,
      orderType: (dbOrder.table_id ? 'table' : 'takeaway') as Order['orderType'],
      items: [], // Items are loaded separately in a real app
      status: dbOrder.status as Order['status'],
      subtotal: dbOrder.subtotal,
      discount: dbOrder.discount || 0,
      discountPercent: dbOrder.discount_percent,
      tax: dbOrder.tax || 0,
      taxPercent: dbOrder.tax_percent,
      total: dbOrder.total,
      createdAt: dbOrder.created_at ? new Date(dbOrder.created_at).getTime() : Date.now(),
      updatedAt: dbOrder.updated_at ? new Date(dbOrder.updated_at).getTime() : Date.now(),
      createdBy: dbOrder.created_by,
      paidAt: dbOrder.paid_at ? new Date(dbOrder.paid_at).getTime() : undefined,
      paymentMethod: dbOrder.payment_method,
      rating: dbOrder.rating,
      ratedAt: dbOrder.rated_at ? new Date(dbOrder.rated_at).getTime() : undefined,
      ratingNote: dbOrder.rating_note,
    };
  }
	
  // Map for takeaway orders from database
  private mapDbTakeawayToOrder(dbTakeaway: any, isTakeaway: true): Order {
    return {
      id: dbTakeaway.id,
      tableId: null,
      orderType: 'takeaway' as const,
      items: [],
      status: dbTakeaway.status as Order['status'],
      subtotal: dbTakeaway.subtotal,
      discount: dbTakeaway.discount || 0,
      discountPercent: dbTakeaway.discount_percent,
      tax: dbTakeaway.tax || 0,
      total: dbTakeaway.total,
      createdAt: dbTakeaway.created_at ? new Date(dbTakeaway.created_at).getTime() : Date.now(),
      updatedAt: dbTakeaway.updated_at ? new Date(dbTakeaway.updated_at).getTime() : Date.now(),
      createdBy: dbTakeaway.created_by,
      customerName: dbTakeaway.customer_name,
      customerPhone: dbTakeaway.customer_phone,
      address: dbTakeaway.address || '',
      deliveryPlatform: dbTakeaway.order_type as TakeawayOrderType,
      notes: dbTakeaway.notes,
      paidAt: dbTakeaway.paid_at ? new Date(dbTakeaway.paid_at).getTime() : undefined,
      paymentMethod: dbTakeaway.payment_method,
    };
  }
	
  private mapOrderToDb(order: Order, isTakeaway: boolean = false): Record<string, any> {
    if (isTakeaway) {
      return {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        discount: order.discount || 0,
        discount_percent: order.discountPercent,
        tax: order.tax || 0,
        total: order.total,
        created_by: order.createdBy,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        order_type: order.deliveryPlatform || 'phone',
        notes: order.notes,
        paid_at: order.paidAt ? new Date(order.paidAt).toISOString() : null,
        payment_method: order.paymentMethod,
        created_at: new Date(order.createdAt).toISOString(),
        updated_at: new Date(order.updatedAt).toISOString(),
      };
    }
    return {
      id: order.id,
      table_id: order.tableId,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      discount_percent: order.discountPercent,
      tax: order.tax || 0,
      tax_percent: order.taxPercent,
      total: order.total,
      created_by: order.createdBy,
      paid_at: order.paidAt ? new Date(order.paidAt).toISOString() : null,
      payment_method: order.paymentMethod,
      rating: order.rating,
      rated_at: order.ratedAt ? new Date(order.ratedAt).toISOString() : null,
      rating_note: order.ratingNote,
      created_at: new Date(order.createdAt).toISOString(),
      updated_at: new Date(order.updatedAt).toISOString(),
    };
  }

  // Menu item mappings
  private mapDbMenuItemToMenuItem(dbItem: any): MenuItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      nameEn: dbItem.name_en || '',
      category: dbItem.category_id as MenuItem['category'],
      price: dbItem.price,
      description: dbItem.description,
      image: dbItem.image_url,
      available: dbItem.available,
      sortOrder: dbItem.sort_order,
      createdAt: dbItem.created_at ? new Date(dbItem.created_at).getTime() : Date.now(),
      updatedAt: dbItem.updated_at ? new Date(dbItem.updated_at).getTime() : Date.now(),
    };
  }

  private mapMenuItemToDb(item: MenuItem): Record<string, any> {
    return {
      id: item.id,
      name: item.name,
      name_en: item.nameEn,
      category_id: item.category,
      price: item.price,
      description: item.description,
      image_url: item.image,
      available: item.available,
      sort_order: item.sortOrder,
      created_at: new Date(item.createdAt).toISOString(),
      updated_at: new Date(item.updatedAt).toISOString(),
    };
  }

  // Audit log mappings
  private mapDbAuditToAudit(dbAudit: any): AuditEntry {
    return {
      id: dbAudit.id,
      userId: dbAudit.user_id,
      userName: dbAudit.user_name,
      userRole: dbAudit.user_role as AuditEntry['userRole'],
      action: dbAudit.action,
      actionType: dbAudit.action_type as AuditEntry['actionType'],
      details: dbAudit.details || {},
      tableId: dbAudit.table_id,
      orderId: dbAudit.order_id,
      timestamp: dbAudit.created_at ? new Date(dbAudit.created_at).getTime() : Date.now(),
    };
  }

  private mapAuditToDb(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Record<string, any> {
    return {
      id: generateId('audit'),
      user_id: entry.userId,
      user_name: entry.userName,
      user_role: entry.userRole,
      action: entry.action,
      action_type: entry.actionType,
      details: entry.details,
      table_id: entry.tableId,
      order_id: entry.orderId,
      created_at: new Date().toISOString(),
    };
  }

  // ============================================
  // Cleanup
  // ============================================
  cleanup(): void {
    this.realtimeChannels.forEach((channel) => {
      supabase?.removeChannel(channel);
    });
    this.realtimeChannels.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const webSync = new WebSyncManager();

// ============================================
// React Hook for Web Sync Status
// ============================================
export function useWebSyncStatus() {
  return useWebSyncStore();
}

// ============================================
// Initialize Web Sync on App Start
// ============================================
export async function initializeWebSync(): Promise<void> {
  return webSync.initialize();
}
