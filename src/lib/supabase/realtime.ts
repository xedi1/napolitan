/**
 * Supabase Realtime Sync
 * 
 * Strategy: Zustand as local cache for UI speed, Supabase as source of truth
 * Any change on one device → push to DB → broadcast → sync on other devices
 * This is the standard pattern for multi-terminal POS systems
 */

import { getSupabaseClient } from './client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Table, MenuItem, Order } from '@/types';

// Singleton to track active subscriptions
const activeChannels: Map<string, RealtimeChannel> = new Map();

// Device ID for this browser instance
let deviceId: string | null = null;

function getDeviceId(): string {
  if (!deviceId) {
    if (typeof window !== 'undefined') {
      deviceId = localStorage.getItem('napoli-device-id') || generateDeviceId();
    } else {
      deviceId = 'server';
    }
  }
  return deviceId;
}

function generateDeviceId(): string {
  const id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('napoli-device-id', id);
  return id;
}

// ============================================
// Type Converters (DB ↔ App Types)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToTable(t: any): Table {
  return {
    id: t.id,
    shape: t.shape,
    group: t.group || t.group_name || 'main',
    position: { x: t.position_x || 0, y: t.position_y || 0 },
    seats: t.seats,
    status: t.status,
    floor: t.floor,
    currentOrderId: t.current_order_id,
    lastUpdated: t.last_updated ? new Date(t.last_updated).getTime() : Date.now(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToMenuItem(item: any): MenuItem {
  return {
    id: item.id,
    name: item.name,
    nameEn: item.name_en || '',
    category: item.category_id || item.category,
    price: item.price,
    description: item.description,
    image: item.image_url || item.image,
    available: item.available ?? true,
    sortOrder: item.sort_order ?? 0,
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
    updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToOrder(order: any): Order {
  return {
    id: order.id,
    tableId: order.table_id,
    orderType: order.table_id ? 'table' : 'takeaway',
    items: ((order.order_items as any[]) || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      name: '',
      quantity: item.quantity,
      price: item.unit_price,
      notes: item.notes,
      category: 'hot_coffee' as const,
    })),
    status: order.status,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    createdAt: new Date(order.created_at).getTime(),
    updatedAt: new Date(order.updated_at).getTime(),
    createdBy: order.created_by,
  };
}

function tableToDb(table: Partial<Table>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (table.shape !== undefined) db.shape = table.shape;
  if (table.group !== undefined) db.group_name = table.group;
  if (table.position !== undefined) {
    db.position_x = table.position.x;
    db.position_y = table.position.y;
  }
  if (table.seats !== undefined) db.seats = table.seats;
  if (table.status !== undefined) db.status = table.status;
  if (table.floor !== undefined) db.floor = table.floor;
  if (table.currentOrderId !== undefined) db.current_order_id = table.currentOrderId;
  return db;
}

// ============================================
// Data Fetching
// ============================================

export async function fetchTablesFromSupabase(): Promise<Table[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .order('id');

  if (error) {
    console.error('[Supabase] Error fetching tables:', error);
    throw error;
  }
  return (data || []).map(dbToTable);
}

export async function fetchMenuItemsFromSupabase(): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('[Supabase] Error fetching menu items:', error);
    throw error;
  }
  return (data || []).map(dbToMenuItem);
}

export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Supabase] Error fetching orders:', error);
    throw error;
  }
  return (data || []).map(dbToOrder);
}

// ============================================
// CRUD Operations (Push to Supabase)
// ============================================

export async function pushTableUpdate(
  tableId: number,
  updates: Partial<Table>
): Promise<void> {
  const supabase = getSupabaseClient();
  const dbUpdates = tableToDb(updates);
  
  const { error } = await supabase
    .from('restaurant_tables')
    .update(dbUpdates)
    .eq('id', tableId);

  if (error) {
    console.error('[Supabase] Error updating table:', error);
    throw error;
  }
  // Note: Supabase will broadcast this change via Realtime
}

export async function pushTableCreate(
  table: Omit<Table, 'id' | 'lastUpdated'>
): Promise<Table> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert({
      name: `میز ${table.floor}`,
      seats: table.seats,
      shape: table.shape,
      status: table.status,
      floor: table.floor,
      group_name: table.group,
      position_x: table.position.x,
      position_y: table.position.y,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating table:', error);
    throw error;
  }
  return dbToTable(data);
}

export async function pushTableDelete(tableId: number): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', tableId);

  if (error) {
    console.error('[Supabase] Error deleting table:', error);
    throw error;
  }
}

export async function pushMenuItemUpdate(
  itemId: string,
  updates: Partial<MenuItem>
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
  if (updates.category !== undefined) dbUpdates.category_id = updates.category;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;
  if (updates.available !== undefined) dbUpdates.available = updates.available;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  
  const { error } = await supabase
    .from('menu_items')
    .update(dbUpdates)
    .eq('id', itemId);

  if (error) {
    console.error('[Supabase] Error updating menu item:', error);
    throw error;
  }
}

export async function pushMenuItemCreate(
  item: Omit<MenuItem, 'createdAt' | 'updatedAt'>
): Promise<MenuItem> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      id: item.id,
      name: item.name,
      name_en: item.nameEn || null,
      category_id: item.category,
      price: item.price,
      description: item.description || null,
      image_url: item.image || null,
      available: item.available,
      sort_order: item.sortOrder,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating menu item:', error);
    throw error;
  }
  return dbToMenuItem(data);
}

export async function pushMenuItemDelete(itemId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('[Supabase] Error deleting menu item:', error);
    throw error;
  }
}

export async function pushOrderCreate(
  order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const supabase = getSupabaseClient();
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: order.tableId,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      total: order.total,
      created_by: order.createdBy,
    } as Record<string, unknown>)
    .select()
    .single();

  if (orderError) throw orderError;

  if (order.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        order.items.map((item) => ({
          order_id: orderData.id,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.notes || null,
        }))
      );

    if (itemsError) throw itemsError;
  }

  return {
    ...order,
    id: orderData.id,
    createdAt: new Date(orderData.created_at).getTime(),
    updatedAt: new Date(orderData.updated_at).getTime(),
  };
}

export async function pushOrderStatusUpdate(
  orderId: string,
  status: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('orders')
    .update({ status } as Record<string, unknown>)
    .eq('id', orderId);

  if (error) throw error;
}

// ============================================
// Realtime Subscriptions
// ============================================

export interface SyncCallbacks {
  onTablesUpdate?: (tables: Table[]) => void;
  onMenuItemsUpdate?: (items: MenuItem[]) => void;
  onOrdersUpdate?: (orders: Order[]) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
}

let currentCallbacks: SyncCallbacks = {};
let isInitialized = false;

export function initializeRealtimeSync(callbacks: SyncCallbacks): () => void {
  currentCallbacks = callbacks;
  
  if (isInitialized) {
    console.log('[Supabase] Realtime already initialized');
    return () => cleanup();
  }
  
  isInitialized = true;
  console.log('[Supabase] Initializing realtime sync, device:', getDeviceId());

  const supabase = getSupabaseClient();

  // Subscribe to tables
  const tablesChannel = supabase
    .channel('tables-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'restaurant_tables' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('[Supabase] Table change received:', payload.eventType);
        handleTableChange(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase] Subscribed to tables');
        callbacks.onConnected?.();
      }
    });

  activeChannels.set('tables', tablesChannel);

  // Subscribe to menu items
  const menuChannel = supabase
    .channel('menu-items-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('[Supabase] Menu item change received:', payload.eventType);
        handleMenuItemChange(payload);
      }
    )
    .subscribe();

  activeChannels.set('menu-items', menuChannel);

  // Subscribe to orders
  const ordersChannel = supabase
    .channel('orders-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('[Supabase] Order change received:', payload.eventType);
        handleOrderChange(payload);
      }
    )
    .subscribe();

  activeChannels.set('orders', ordersChannel);

  // Fetch initial data
  fetchInitialData();

  return () => cleanup();
}

async function fetchInitialData() {
  try {
    const [tables, menuItems, orders] = await Promise.all([
      fetchTablesFromSupabase().catch((e) => {
        console.error('[Supabase] Failed to fetch tables:', e);
        return null;
      }),
      fetchMenuItemsFromSupabase().catch((e) => {
        console.error('[Supabase] Failed to fetch menu items:', e);
        return null;
      }),
      fetchOrdersFromSupabase().catch((e) => {
        console.error('[Supabase] Failed to fetch orders:', e);
        return null;
      }),
    ]);

    if (tables) currentCallbacks.onTablesUpdate?.(tables);
    if (menuItems) currentCallbacks.onMenuItemsUpdate?.(menuItems);
    if (orders) currentCallbacks.onOrdersUpdate?.(orders);
  } catch (error) {
    console.error('[Supabase] Error fetching initial data:', error);
    currentCallbacks.onError?.(error as Error);
  }
}

function handleTableChange(_payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) {
  fetchTablesFromSupabase()
    .then((tables) => currentCallbacks.onTablesUpdate?.(tables))
    .catch((e) => currentCallbacks.onError?.(e as Error));
}

function handleMenuItemChange(_payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) {
  fetchMenuItemsFromSupabase()
    .then((items) => currentCallbacks.onMenuItemsUpdate?.(items))
    .catch((e) => currentCallbacks.onError?.(e as Error));
}

function handleOrderChange(_payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) {
  fetchOrdersFromSupabase()
    .then((orders) => currentCallbacks.onOrdersUpdate?.(orders))
    .catch((e) => currentCallbacks.onError?.(e as Error));
}

function cleanup() {
  console.log('[Supabase] Cleaning up realtime subscriptions');
  activeChannels.forEach((channel, name) => {
    channel.unsubscribe();
    console.log(`[Supabase] Unsubscribed from ${name}`);
  });
  activeChannels.clear();
  isInitialized = false;
}

export function unsubscribeAll() {
  cleanup();
}

// ============================================
// Utility
// ============================================

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'https://your-project.supabase.co');
}
