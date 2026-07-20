/**
 * Supabase Realtime Sync Layer
 * 
 * This module provides real-time synchronization between local Zustand stores
 * and Supabase backend. When Supabase is configured, changes are:
 * 1. Written to Supabase immediately
 * 2. Broadcast to all connected clients via Supabase Realtime
 * 
 * When Supabase is NOT configured, falls back to localStorage persistence.
 */

import { supabase, isSupabaseConfigured } from './client';
import type { Table, Order, AuditEntry } from '@/types';

// Type definitions for Supabase records
interface SupabaseTable {
  id: number;
  shape: string;
  group_name: string;
  position_x: number;
  position_y: number;
  seats: number;
  status: string;
  current_order_id: string | null;
  updated_at: string;
}

interface SupabaseOrder {
  id: string;
  table_id: number;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseAuditEntry {
  id: string;
  action_type: string;
  table_id: number | null;
  order_id: string | null;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  details: any;
  created_at: string;
}

// Callback types
type TableUpdateCallback = (tables: Table[]) => void;
type OrderUpdateCallback = (orders: Order[]) => void;
type AuditUpdateCallback = (entries: AuditEntry[]) => void;

// Subscription holders
let tablesSubscription: ReturnType<typeof supabase.channel> | null = null;
let ordersSubscription: ReturnType<typeof supabase.channel> | null = null;
let auditSubscription: ReturnType<typeof supabase.channel> | null = null;

/**
 * Convert Supabase table record to local Table type
 */
function toLocalTable(record: SupabaseTable): Table {
  return {
    id: record.id,
    shape: record.shape as 'circle' | 'rectangle',
    group: record.group_name,
    position: { x: record.position_x, y: record.position_y },
    seats: record.seats,
    status: record.status as any,
    currentOrder: record.current_order_id || undefined,
    lastUpdated: new Date(record.updated_at).getTime(),
  };
}

/**
 * Convert local Table to Supabase record
 */
function toSupabaseTable(table: Table): Partial<SupabaseTable> {
  return {
    id: table.id,
    shape: table.shape,
    group_name: table.group,
    position_x: table.position.x,
    position_y: table.position.y,
    seats: table.seats,
    status: table.status,
    current_order_id: table.currentOrder || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert Supabase order record to local Order type
 */
function toLocalOrder(record: SupabaseOrder): Order {
  return {
    id: record.id,
    tableId: record.table_id,
    items: record.items || [],
    subtotal: record.subtotal,
    discount: record.discount,
    tax: record.tax,
    total: record.total,
    status: record.status as any,
    createdAt: new Date(record.created_at).getTime(),
    updatedAt: new Date(record.updated_at).getTime(),
    createdBy: 0, // Will be overwritten when loaded from local state
  };
}

/**
 * Convert local Order to Supabase record
 */
function toSupabaseOrder(order: Order): Partial<SupabaseOrder> {
  return {
    id: order.id,
    table_id: order.tableId,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    status: order.status,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert Supabase audit entry to local AuditEntry type
 */
function toLocalAuditEntry(record: SupabaseAuditEntry): AuditEntry {
  return {
    id: record.id,
    actionType: record.action_type as any,
    tableId: record.table_id || undefined,
    userId: record.user_id || 0,
    userName: record.user_name || '',
    userRole: record.user_role as any,
    action: record.details?.action || '',
    details: JSON.stringify(record.details || {}),
    timestamp: new Date(record.created_at).getTime(),
  };
}

/**
 * Sync Service - manages real-time subscriptions
 */
export const syncService = {
  /**
   * Initialize sync service
   */
  async initialize(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('[Sync] Supabase not configured, using local storage');
      return false;
    }

    try {
      // Test connection
      const { error } = await supabase.from('tables').select('id').limit(1);
      if (error) {
        console.warn('[Sync] Supabase connection failed:', error.message);
        return false;
      }
      console.log('[Sync] Connected to Supabase');
      return true;
    } catch (e) {
      console.warn('[Sync] Supabase initialization failed');
      return false;
    }
  },

  /**
   * Load all tables from Supabase
   */
  async loadTables(): Promise<Table[] | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('[Sync] Failed to load tables:', error);
      return null;
    }
    
    return (data as SupabaseTable[]).map(toLocalTable);
  },

  /**
   * Update a table in Supabase
   */
  async updateTable(table: Table): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('tables')
      .update(toSupabaseTable(table))
      .eq('id', table.id);

    if (error) {
      console.error('[Sync] Failed to update table:', error);
      return false;
    }
    return true;
  },

  /**
   * Subscribe to table changes
   */
  subscribeToTables(callback: TableUpdateCallback): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    // Unsubscribe if already subscribed
    if (tablesSubscription) {
      tablesSubscription.unsubscribe();
    }

    tablesSubscription = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        async () => {
          const tables = await this.loadTables();
          if (tables) callback(tables);
        }
      )
      .subscribe();

    return () => {
      if (tablesSubscription) {
        tablesSubscription.unsubscribe();
        tablesSubscription = null;
      }
    };
  },

  /**
   * Load all orders from Supabase
   */
  async loadOrders(): Promise<Order[] | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Sync] Failed to load orders:', error);
      return null;
    }

    return (data as SupabaseOrder[]).map(toLocalOrder);
  },

  /**
   * Create a new order in Supabase
   */
  async createOrder(order: Order): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('orders')
      .insert(toSupabaseOrder(order) as any);

    if (error) {
      console.error('[Sync] Failed to create order:', error);
      return false;
    }
    return true;
  },

  /**
   * Update an order in Supabase
   */
  async updateOrder(order: Order): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('orders')
      .update(toSupabaseOrder(order))
      .eq('id', order.id);

    if (error) {
      console.error('[Sync] Failed to update order:', error);
      return false;
    }
    return true;
  },

  /**
   * Delete an order from Supabase
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('[Sync] Failed to delete order:', error);
      return false;
    }
    return true;
  },

  /**
   * Subscribe to order changes
   */
  subscribeToOrders(callback: OrderUpdateCallback): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
    }

    ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const orders = await this.loadOrders();
          if (orders) callback(orders);
        }
      )
      .subscribe();

    return () => {
      if (ordersSubscription) {
        ordersSubscription.unsubscribe();
        ordersSubscription = null;
      }
    };
  },

  /**
   * Load audit log from Supabase
   */
  async loadAuditLog(limit = 100): Promise<AuditEntry[] | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Sync] Failed to load audit log:', error);
      return null;
    }

    return (data as SupabaseAuditEntry[]).map(toLocalAuditEntry);
  },

  /**
   * Add audit entry to Supabase
   */
  async addAuditEntry(entry: AuditEntry): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase.from('audit_log').insert({
      id: entry.id,
      action_type: entry.actionType,
      table_id: entry.tableId || null,
      user_id: entry.userId || null,
      user_name: entry.userName || null,
      user_role: entry.userRole || null,
      details: { action: entry.action, ...(typeof entry.details === 'string' ? JSON.parse(entry.details) : entry.details) },
      created_at: new Date(entry.timestamp).toISOString(),
    });

    if (error) {
      console.error('[Sync] Failed to add audit entry:', error);
      return false;
    }
    return true;
  },

  /**
   * Subscribe to audit log changes
   */
  subscribeToAuditLog(callback: AuditUpdateCallback): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    if (auditSubscription) {
      auditSubscription.unsubscribe();
    }

    auditSubscription = supabase
      .channel('audit-log-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        async () => {
          const entries = await this.loadAuditLog();
          if (entries) callback(entries);
        }
      )
      .subscribe();

    return () => {
      if (auditSubscription) {
        auditSubscription.unsubscribe();
        auditSubscription = null;
      }
    };
  },

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    if (tablesSubscription) {
      tablesSubscription.unsubscribe();
      tablesSubscription = null;
    }
    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
      ordersSubscription = null;
    }
    if (auditSubscription) {
      auditSubscription.unsubscribe();
      auditSubscription = null;
    }
  },

  /**
   * Check if real-time sync is active
   */
  isActive(): boolean {
    return isSupabaseConfigured();
  },
};

export { toLocalTable, toLocalOrder, toLocalAuditEntry };
