/**
 * Supabase Realtime
 * Manages realtime subscriptions for all data
 * 
 * This enables real-time sync across all devices:
 * - When a waiter changes a table status, kitchen sees it instantly
 * - When kitchen marks order ready, waiter sees it instantly
 * - All devices always show the same data
 */

import { getSupabaseClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Table, MenuItem, Order } from '@/types';

// Singleton to track active subscriptions
const activeChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to table changes
 */
export function subscribeToTables(
  onUpdate: (tables: Table[]) => void,
  onError?: (error: Error) => void
) {
  const channelName = 'tables-changes';
  
  if (activeChannels.has(channelName)) {
    return () => unsubscribe(channelName);
  }

  const supabase = getSupabaseClient();
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
      },
      () => {
        fetchTables().then(onUpdate).catch((err) => {
          console.error('[Supabase] Error fetching tables:', err);
          onError?.(err);
        });
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  fetchTables().then(onUpdate).catch((err) => {
    console.error('[Supabase] Error fetching tables:', err);
    onError?.(err);
  });

  return () => unsubscribe(channelName);
}

/**
 * Subscribe to menu item changes
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void,
  onError?: (error: Error) => void
) {
  const channelName = 'menu-items-changes';
  
  if (activeChannels.has(channelName)) {
    return () => unsubscribe(channelName);
  }

  const supabase = getSupabaseClient();
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_items',
      },
      () => {
        fetchMenuItems().then(onUpdate).catch((err) => {
          console.error('[Supabase] Error fetching menu items:', err);
          onError?.(err);
        });
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  fetchMenuItems().then(onUpdate).catch((err) => {
    console.error('[Supabase] Error fetching menu items:', err);
    onError?.(err);
  });

  return () => unsubscribe(channelName);
}

/**
 * Subscribe to order changes
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const channelName = 'orders-changes';
  
  if (activeChannels.has(channelName)) {
    return () => unsubscribe(channelName);
  }

  const supabase = getSupabaseClient();
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        fetchOrders().then(onUpdate).catch((err) => {
          console.error('[Supabase] Error fetching orders:', err);
          onError?.(err);
        });
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  fetchOrders().then(onUpdate).catch((err) => {
    console.error('[Supabase] Error fetching orders:', err);
    onError?.(err);
  });

  return () => unsubscribe(channelName);
}

// ============================================
// Data Fetching Functions
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyToTable(t: any): Table {
  return {
    id: t.id,
    shape: t.shape,
    group: t.group,
    position: { x: t.position_x, y: t.position_y },
    seats: t.seats,
    status: t.status,
    floor: t.floor,
    currentOrderId: t.current_order_id,
    lastUpdated: new Date(t.updated_at).getTime(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyToMenuItem(item: any): MenuItem {
  return {
    id: item.id,
    name: item.name,
    nameEn: item.name_en || '',
    category: item.category as MenuItem['category'],
    price: item.price,
    available: item.available,
    sortOrder: item.sort_order,
    createdAt: new Date(item.created_at).getTime(),
    updatedAt: new Date(item.updated_at).getTime(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyToOrder(order: any): Order {
  // Note: order_items from Supabase only has basic fields.
  // name, nameEn, price, category should be fetched from menu_items if needed.
  return {
    id: order.id,
    tableId: order.table_id,
    items: ((order.order_items as any[]) || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      name: '', // Will be populated when joined with menu_items
      quantity: item.quantity,
      price: item.unit_price, // Using unit_price from order_items
      notes: item.notes,
      category: 'hot_coffee' as const, // Default category, ideally from menu_items
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

async function fetchTables(): Promise<Table[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('id');

  if (error) throw error;
  return (data || []).map(anyToTable);
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return (data || []).map(anyToMenuItem);
}

async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(anyToOrder);
}

// ============================================
// CRUD Operations
// ============================================

export async function updateTableInSupabase(
  tableId: number,
  updates: Partial<Table>
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.currentOrderId !== undefined) dbUpdates.current_order_id = updates.currentOrderId;
  
  const { error } = await supabase
    .from('tables')
    .update(dbUpdates)
    .eq('id', tableId);

  if (error) throw error;
}

export async function addTableToSupabase(
  table: Omit<Table, 'id' | 'lastUpdated'>
): Promise<Table> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tables')
    .insert({
      name: `میز ${table.floor}`,
      seats: table.seats,
      shape: table.shape,
      status: table.status,
      floor: table.floor,
      group: table.group,
      position_x: table.position.x,
      position_y: table.position.y,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw error;
  return anyToTable(data);
}

export async function updateMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('menu_items')
    .update({ available } as Record<string, unknown>)
    .eq('id', itemId);

  if (error) throw error;
}

export async function createOrderInSupabase(
  order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const supabase = getSupabaseClient();
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: order.tableId,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
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
          unit_price: item.price, // Using price instead of unitPrice
          notes: item.notes,
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

export async function updateOrderStatusInSupabase(
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
// Utility
// ============================================

function unsubscribe(channelName: string) {
  const channel = activeChannels.get(channelName);
  if (channel) {
    channel.unsubscribe();
    activeChannels.delete(channelName);
  }
}

export function unsubscribeAll() {
  activeChannels.forEach((channel, name) => {
    channel.unsubscribe();
    activeChannels.delete(name);
  });
}
