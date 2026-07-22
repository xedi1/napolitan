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
// Category Icons & Images
// ============================================
export const CATEGORY_CONFIG: Record<MenuCategory, { icon: string; label: string; color: string; fallbackImage: string }> = {
  hot_coffee: { icon: '☕', label: 'قهوه گرم', color: '#8B4513', fallbackImage: '/images/menu/hot-coffee.svg' },
  cold_coffee: { icon: '🧊', label: 'قهوه سرد', color: '#4682B4', fallbackImage: '/images/menu/cold-coffee.svg' },
  drip_coffee: { icon: '🫖', label: 'قهوه دمی', color: '#5F9EA0', fallbackImage: '/images/menu/drip-coffee.svg' },
  hot_bar: { icon: '🍵', label: 'بار گرم', color: '#D2691E', fallbackImage: '/images/menu/hot-bar.svg' },
  tea: { icon: '🍃', label: 'چای', color: '#228B22', fallbackImage: '/images/menu/tea.svg' },
  frappe: { icon: '🥤', label: 'گلاسه', color: '#9370DB', fallbackImage: '/images/menu/frappe.svg' },
  shake_bar: { icon: '🥛', label: 'شیک بار', color: '#FFB6C1', fallbackImage: '/images/menu/shake-bar.svg' },
  mojito: { icon: '🍹', label: 'ماکتیل', color: '#20B2AA', fallbackImage: '/images/menu/mojito.svg' },
  baked_potato: { icon: '🥔', label: 'سیب‌زمینی تنوری', color: '#DAA520', fallbackImage: '/images/menu/baked-potato.svg' },
  italian_plate: { icon: '🍝', label: 'بشقاب ایتالیایی', color: '#FFD700', fallbackImage: '/images/menu/italian-plate.svg' },
  burger: { icon: '🍔', label: 'برگر', color: '#FF6347', fallbackImage: '/images/menu/burger.svg' },
  pizza: { icon: '🍕', label: 'پیتزا', color: '#FF4500', fallbackImage: '/images/menu/pizza.svg' },
  cake_dessert: { icon: '🍰', label: 'کیک و دسر', color: '#FF69B4', fallbackImage: '/images/menu/cake-dessert.svg' },
};

export function getCategoryConfig(category: MenuCategory) {
  return CATEGORY_CONFIG[category] || { icon: '🍽️', label: category, color: '#888', fallbackImage: '/images/menu/default.svg' };
}

// ============================================
// Menu Images Provider
// ============================================
export interface MenuItemImage {
  itemId: string;
  imageUrl: string;
  alt: string;
}

/**
 * Get the best image for a menu item
 * - If item has image_url, use that
 * - Otherwise, use category fallback
 */
export function getMenuItemImage(item: MenuItem): MenuItemImage {
  const categoryConfig = getCategoryConfig(item.category);
  
  return {
    itemId: item.id,
    imageUrl: item.image || categoryConfig.fallbackImage,
    alt: item.name,
  };
}

/**
 * Generate srcset for responsive images
 * Supports: mobile (320w), tablet (768w), desktop (1024w), large (1440w)
 */
export function generateSrcSet(imageUrl: string): string {
  // If it's an external URL (Supabase Storage, CDN), generate srcset
  if (imageUrl.startsWith('http')) {
    // For Supabase Storage, add width parameters
    if (imageUrl.includes('supabase')) {
      return `${imageUrl}?width=320 320w, ${imageUrl}?width=768 768w, ${imageUrl}?width=1024 1024w`;
    }
    // For other URLs, assume same image at different sizes
    return imageUrl;
  }
  
  // For local images, generate paths for different sizes
  const basePath = imageUrl.replace('.webp', '');
  return `${basePath}-320.webp 320w, ${basePath}-768.webp 768w, ${basePath}-1024.webp 1024w`;
}

/**
 * Get optimized image sizes for different viewports
 */
export const IMAGE_SIZES = {
  mobile: '100vw',
  tablet: '50vw',
  desktop: '33vw',
  large: '25vw',
};
