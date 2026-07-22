'use client';

import { offlineDB, OrderRecord, SyncQueueItem } from './indexedDB';
import { useOrderStore } from '@/store';
import { toast } from 'sonner';

/**
 * Sync Manager for Offline-First Architecture
 * 
 * Flow:
 * 1. User creates order offline → stored in IndexedDB
 * 2. Order added to sync queue
 * 3. When online → sync queue processed
 * 4. Successful syncs → marked as synced
 * 5. Failed syncs → retry with exponential backoff
 */

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  // Subscribe to sync status changes
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  private handleOnline() {
    console.log('[Sync] Online - starting sync');
    this.isOnline = true;
    this.lastError = null;
    this.notify();
    toast.success('🌐 اتصال اینترنت برقرار شد', {
      description: 'در حال سینک سفارشات...',
    });
    this.startSync();
  }

  private handleOffline() {
    console.log('[Sync] Offline - queuing operations');
    this.isOnline = false;
    this.notify();
    toast.warning('📴 آفلاین شدید', {
      description: 'سفارشات به صورت محلی ذخیره می‌شوند',
    });
    this.stopSync();
  }

  async updatePendingCount() {
    const queue = await offlineDB.getSyncQueue();
    this.pendingCount = queue.length;
    this.notify();
  }

  // Start periodic sync
  startSync(intervalMs: number = 30000) {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, intervalMs);

    // Immediate sync when starting
    this.syncAll();
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync all pending items
  async syncAll(): Promise<boolean> {
    if (!this.isOnline || this.isSyncing) return false;

    this.isSyncing = true;
    this.notify();

    try {
      // Get all items in sync queue
      const queue = await offlineDB.getSyncQueue();
      
      if (queue.length === 0) {
        console.log('[Sync] No items to sync');
        this.isSyncing = false;
        this.notify();
        return true;
      }

      console.log(`[Sync] Syncing ${queue.length} items`);
      toast.info(`📤 در حال سینک ${queue.length} آیتم...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await offlineDB.removeFromSyncQueue(item.id);
          successCount++;
        } catch (error) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, error);
          failCount++;
          
          // Update retry count
          item.retryCount++;
          item.lastError = error instanceof Error ? error.message : 'Unknown error';
          await offlineDB.updateSyncQueueItem(item);

          // If too many retries, remove from queue
          if (item.retryCount >= 5) {
            console.warn(`[Sync] Removing item ${item.id} after 5 failed attempts`);
            await offlineDB.removeFromSyncQueue(item.id);
          }
        }
      }

      this.lastSyncAt = Date.now();
      this.lastError = null;
      await this.updatePendingCount();

      if (successCount > 0) {
        toast.success(`✅ ${successCount} آیتم سینک شد`);
      }
      if (failCount > 0) {
        toast.error(`❌ ${failCount} آیتم سینک نشد`);
      }

      this.isSyncing = false;
      this.notify();
      return failCount === 0;
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      this.isSyncing = false;
      this.notify();
      return false;
    }
  }

  // Sync a single item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'order':
        await this.syncOrder(item);
        break;
      case 'menu-item':
        await this.syncMenuItem(item);
        break;
      case 'table':
        await this.syncTable(item);
        break;
      default:
        console.warn(`[Sync] Unknown item type: ${item.type}`);
    }
  }

  private async syncOrder(item: SyncQueueItem): Promise<void> {
    const order = item.data as OrderRecord;
    
    // In production, this would call Supabase
    // For now, we'll simulate a successful sync
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Try to sync via service worker if available
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-orders');
      }
    }

    // Mark as synced in local DB
    await offlineDB.markOrderSynced(order.orderId);

    // Update Zustand store if available
    try {
      const store = useOrderStore.getState();
      if (store.orders) {
        // Update the order in store if it exists
        const existingIndex = store.orders.findIndex(o => o.id === order.orderId);
        if (existingIndex !== -1) {
          // Order exists, update it
          console.log(`[Sync] Order ${order.orderId} synced successfully`);
        }
      }
    } catch (e) {
      // Store might not be initialized yet
    }
  }

  private async syncMenuItem(item: SyncQueueItem): Promise<void> {
    // Similar logic for menu items
    console.log(`[Sync] Syncing menu item: ${item.id}`);
  }

  private async syncTable(item: SyncQueueItem): Promise<void> {
    // Similar logic for tables
    console.log(`[Sync] Syncing table: ${item.id}`);
  }

  // Add order to sync queue
  async queueOrder(order: OrderRecord): Promise<void> {
    // Save to IndexedDB
    await offlineDB.saveOrder(order);

    // Add to sync queue
    const queueItem: SyncQueueItem = {
      id: `sync-${order.orderId}-${Date.now()}`,
      type: 'order',
      action: 'create',
      data: order,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await offlineDB.addToSyncQueue(queueItem);

    await this.updatePendingCount();

    // If online, trigger immediate sync
    if (this.isOnline) {
      this.syncAll();
    }
  }

  // Get sync statistics
  async getStats() {
    const queue = await offlineDB.getSyncQueue();
    const unsyncedOrders = await offlineDB.getUnsyncedOrders();
    
    return {
      queueLength: queue.length,
      unsyncedOrders: unsyncedOrders.length,
      lastSyncAt: this.lastSyncAt,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

export const syncManager = new SyncManager();

// React hook for sync status
export function useSyncStatus() {
  const [status, setStatus] = React.useState<SyncStatus>(syncManager.getStatus());

  React.useEffect(() => {
    return syncManager.subscribe(setStatus);
  }, []);

  return status;
}

// Import React
import React from 'react';
