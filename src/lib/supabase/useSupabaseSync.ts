/**
 * useSupabaseSync
 * 
 * React hook that syncs Zustand stores with Supabase in real-time
 * 
 * Architecture:
 * - Zustand = local cache (fast UI updates)
 * - Supabase = source of truth (durable, synced across devices)
 * 
 * Flow: User action → Update Zustand (instant UI) → Push to Supabase → Broadcast → Other devices sync
 */

'use client';

import { useEffect, useState } from 'react';
import { useTableStore, useMenuStore, useOrderStore } from '@/store';
import {
  initializeRealtimeSync,
  unsubscribeAll,
  isSupabaseConfigured,
  type SyncCallbacks,
} from './realtime';
import { toast } from 'sonner';

interface SupabaseSyncState {
  isConnected: boolean;
  isConfigured: boolean;
  error: Error | null;
  lastSync: Date | null;
}

export function useSupabaseSync(): SupabaseSyncState {
  const [state, setState] = useState<SupabaseSyncState>({
    isConnected: false,
    isConfigured: isSupabaseConfigured(),
    error: null,
    lastSync: null,
  });

  // Get store actions
  const setTables = useTableStore((s) => s.setTables);
  const setItems = useMenuStore((s) => s.setItems);
  const setOrders = useOrderStore((s) => s.setOrders);

  useEffect(() => {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('[SupabaseSync] Not configured, using local state only');
      return;
    }

    const callbacks: SyncCallbacks = {
      onTablesUpdate: (tables) => {
        console.log('[SupabaseSync] Tables updated from remote');
        setTables(tables);
      },
      onMenuItemsUpdate: (items) => {
        console.log('[SupabaseSync] Menu items updated from remote');
        setItems(items);
      },
      onOrdersUpdate: (orders) => {
        console.log('[SupabaseSync] Orders updated from remote');
        setOrders(orders);
      },
      onConnected: () => {
        console.log('[SupabaseSync] Connected to Supabase Realtime');
        setState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
          lastSync: new Date(),
        }));
      },
      onError: (error) => {
        console.error('[SupabaseSync] Error:', error);
        setState((prev) => ({ ...prev, error, isConnected: false }));
        toast.error('خطا در اتصال به سرور');
      },
    };

    // Initialize realtime sync
    const cleanup = initializeRealtimeSync(callbacks);

    return () => {
      cleanup();
      unsubscribeAll();
    };
  }, [setTables, setItems, setOrders]);

  return state;
}

/**
 * Hook to check if Supabase is configured
 */
export function useSupabaseConfigured(): boolean {
  return isSupabaseConfigured();
}
