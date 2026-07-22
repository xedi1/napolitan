/**
 * useSupabaseSync
 * React hook to sync Zustand stores with Supabase in real-time
 * 
 * Usage:
 *   const { isConnected, error } = useSupabaseSync();
 * 
 * This hook:
 * 1. Subscribes to realtime changes in Supabase
 * 2. Updates Zustand stores when data changes
 * 3. Ensures ALL devices see the same data instantly
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useTableStore, useMenuStore, useOrderStore } from '@/store';
import {
  subscribeToTables,
  subscribeToMenuItems,
  subscribeToOrders,
  unsubscribeAll,
} from './realtime';

interface SupabaseSyncState {
  isConnected: boolean;
  error: Error | null;
  lastSync: Date | null;
}

export function useSupabaseSync(): SupabaseSyncState {
  const [state, setState] = useState<SupabaseSyncState>({
    isConnected: false,
    error: null,
    lastSync: null,
  });

  const isInitialized = useRef(false);
  
  // Get store actions
  const { setTables } = useTableStore();
  const { setItems } = useMenuStore();
  const { setOrders } = useOrderStore();

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let tablesUnsub: (() => void) | null = null;
    let menuUnsub: (() => void) | null = null;
    let ordersUnsub: (() => void) | null = null;

    const handleError = (error: Error) => {
      console.error('[Supabase Sync] Error:', error);
      setState((prev) => ({ ...prev, error, isConnected: false }));
    };

    const handleSuccess = () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
        lastSync: new Date(),
      }));
    };

    try {
      // Subscribe to tables
      tablesUnsub = subscribeToTables(
        (tables) => {
          setTables(tables);
          handleSuccess();
        },
        handleError
      );

      // Subscribe to menu items
      menuUnsub = subscribeToMenuItems(
        (items) => {
          setItems(items);
          handleSuccess();
        },
        handleError
      );

      // Subscribe to orders
      ordersUnsub = subscribeToOrders(
        (orders) => {
          setOrders(orders);
          handleSuccess();
        },
        handleError
      );
    } catch (err) {
      handleError(err as Error);
    }

    // Cleanup on unmount
    return () => {
      tablesUnsub?.();
      menuUnsub?.();
      ordersUnsub?.();
      unsubscribeAll();
    };
  }, [setTables, setItems, setOrders]);

  return state;
}

/**
 * Hook to check if Supabase is configured
 */
export function useSupabaseConfigured(): boolean {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setConfigured(!!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co');
  }, []);

  return configured;
}
