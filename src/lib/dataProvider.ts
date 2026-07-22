/**
 * Data Provider
 * 
 * Unified data access layer for all components
 * All data comes from Zustand stores (which sync with Supabase)
 * Components should NOT read directly from Supabase
 * 
 * This ensures:
 * - Single source of truth
 * - Consistent data format
 * - Easy to mock for testing
 * - Cached locally for fast UI
 */

'use client';

import { useMemo } from 'react';
import { useTableStore, useMenuStore, useOrderStore, useAuthStore } from '@/store';
import { isSupabaseConfigured } from './supabase/realtime';
import type { Table, MenuItem, Order, TableFloor, TableStatus, MenuCategory } from '@/types';

// ============================================
// Menu Items Provider
// ============================================
export function useMenuItems(category?: MenuCategory | null) {
  const items = useMenuStore((s) => s.items);
  const isLoading = useMenuStore((s) => s.isLoading);

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => item.available);
    if (category) {
      result = result.filter((item) => item.category === category);
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items, category]);

  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    items.filter((item) => item.available).forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    // Sort each category
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    return grouped;
  }, [items]);

  return {
    items: filteredItems,
    itemsByCategory,
    isLoading,
    isConfigured: isSupabaseConfigured(),
  };
}

// ============================================
// Tables Provider
// ============================================
export function useTables(floor?: TableFloor | null) {
  const tables = useTableStore((s) => s.tables);
  const selectedTableId = useTableStore((s) => s.selectedTableId);

  const filteredTables = useMemo(() => {
    if (floor) {
      return tables.filter((t) => t.floor === floor);
    }
    return tables;
  }, [tables, floor]);

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || null,
    [tables, selectedTableId]
  );

  const tablesByFloor = useMemo(() => {
    const grouped: Record<number, Table[]> = { 1: [], 2: [] };
    tables.forEach((table) => {
      if (grouped[table.floor]) {
        grouped[table.floor].push(table);
      }
    });
    return grouped;
  }, [tables]);

  const tablesByStatus = useMemo(() => {
    const grouped: Record<TableStatus, Table[]> = {
      available: [],
      occupied: [],
      preparing: [],
      awaiting: [],
      eating: [],
      reserved: [],
      cleaning: [],
    };
    tables.forEach((table) => {
      if (grouped[table.status]) {
        grouped[table.status].push(table);
      }
    });
    return grouped;
  }, [tables]);

  return {
    tables: filteredTables,
    tablesByFloor,
    tablesByStatus,
    selectedTable,
    selectedTableId,
    isConfigured: isSupabaseConfigured(),
  };
}

// ============================================
// Orders Provider
// ============================================
export function useOrders(options?: {
  tableId?: number;
  status?: Order['status'];
  limit?: number;
}) {
  const orders = useOrderStore((s) => s.orders);
  const currentOrder = useOrderStore((s) => s.currentOrder);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    if (options?.tableId) {
      result = result.filter((o) => o.tableId === options.tableId);
    }
    if (options?.status) {
      result = result.filter((o) => o.status === options.status);
    }
    
    // Sort by createdAt descending
    result.sort((a, b) => b.createdAt - a.createdAt);
    
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }, [orders, options?.tableId, options?.status, options?.limit]);

  const ordersByStatus = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
    const ready = orders.filter((o) => o.status === 'ready');
    const active = orders.filter((o) => !['paid', 'cancelled'].includes(o.status));
    return { pending, ready, active };
  }, [orders]);

  return {
    orders: filteredOrders,
    ordersByStatus,
    currentOrder,
    isConfigured: isSupabaseConfigured(),
  };
}

// ============================================
// Kitchen Orders Provider
// ============================================
export function useKitchenOrders() {
  const { orders, ordersByStatus } = useOrders();
  
  const pendingOrders = ordersByStatus.pending;
  const readyOrders = ordersByStatus.ready;

  const stats = useMemo(() => ({
    pending: pendingOrders.length,
    ready: readyOrders.length,
    total: orders.length,
  }), [pendingOrders, readyOrders, orders.length]);

  return {
    pendingOrders,
    readyOrders,
    stats,
    isConfigured: isSupabaseConfigured(),
  };
}

// ============================================
// User Provider
// ============================================
export function useUser() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isManager = currentUser?.role === 'manager';
  const isKitchen = currentUser?.role === 'kitchen';
  const isWaiter = currentUser?.role === 'waiter';

  return {
    currentUser,
    isAuthenticated,
    isManager,
    isKitchen,
    isWaiter,
    role: currentUser?.role,
  };
}

// ============================================
// Table Stats Provider
// ============================================
export function useTableStats(floor?: TableFloor) {
  const { tables, tablesByStatus } = useTables(floor ?? null);

  const stats = useMemo(() => {
    const floorTables = floor ? tables.filter((t) => t.floor === floor) : tables;
    return {
      total: floorTables.length,
      available: floorTables.filter((t) => t.status === 'available').length,
      occupied: floorTables.filter((t) => t.status === 'occupied').length,
      preparing: floorTables.filter((t) => t.status === 'preparing').length,
      reserved: floorTables.filter((t) => t.status === 'reserved').length,
    };
  }, [tables, floor]);

  return stats;
}

// ============================================
// Category Icons
// ============================================
export const CATEGORY_CONFIG: Record<MenuCategory, { icon: string; label: string; color: string }> = {
  hot_coffee: { icon: '☕', label: 'قهوه گرم', color: '#8B4513' },
  cold_coffee: { icon: '🧊', label: 'قهوه سرد', color: '#4682B4' },
  drip_coffee: { icon: '💧', label: 'قهوه قطره‌ای', color: '#5F9EA0' },
  hot_bar: { icon: '🍫', label: 'بار گرم', color: '#D2691E' },
  tea: { icon: '🍵', label: 'چای', color: '#228B22' },
  frappe: { icon: '🥤', label: 'فراپه', color: '#9370DB' },
  shake_bar: { icon: '🥛', label: 'شیک بار', color: '#FFB6C1' },
  mojito: { icon: '🍹', label: 'موهیتو', color: '#20B2AA' },
  baked_potato: { icon: '🥔', label: 'سیب زمینی', color: '#DAA520' },
  italian_plate: { icon: '🍝', label: 'پاستا', color: '#FFD700' },
  burger: { icon: '🍔', label: 'برگر', color: '#FF6347' },
  pizza: { icon: '🍕', label: 'پیتزا', color: '#FF4500' },
  cake_dessert: { icon: '🍰', label: 'کیک و دسر', color: '#FF69B4' },
};

export function getCategoryConfig(category: MenuCategory) {
  return CATEGORY_CONFIG[category] || { icon: '🍽️', label: category, color: '#888' };
}
