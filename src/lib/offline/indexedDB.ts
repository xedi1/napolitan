'use client';

/**
 * IndexedDB Storage for Offline Data
 * Stores orders, menu items, and sync queue locally
 */

const DB_NAME = 'napolitan-offline';
const DB_VERSION = 1;

interface DBSchema {
  orders: OrderRecord;
  menuItems: MenuItemRecord;
  syncQueue: SyncQueueItem;
}

export interface OrderRecord {
  id: string;
  orderId: string;
  tableId: number | null;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    nameEn?: string;
    quantity: number;
    price: number;
    notes?: string;
    category: string;
  }>;
  status: string;
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  tax?: number;
  taxPercent?: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  paidAt?: number;
  paymentMethod?: 'cash' | 'card' | 'online';
  isSynced: boolean;
  syncedAt?: number;
}

export interface MenuItemRecord {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  isAvailable: boolean;
  isSynced: boolean;
  lastUpdated: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'order' | 'menu-item' | 'table';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'orderId' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('isSynced', 'isSynced', { unique: false });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Menu items store
        if (!db.objectStoreNames.contains('menuItems')) {
          const menuStore = db.createObjectStore('menuItems', { keyPath: 'id' });
          menuStore.createIndex('category', 'category', { unique: false });
          menuStore.createIndex('isAvailable', 'isAvailable', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // App state store
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  // Orders
  async saveOrder(order: OrderRecord): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('orders', 'readwrite');
    await tx.objectStore('orders').put(order);
  }

  async getOrder(orderId: string): Promise<OrderRecord | undefined> {
    await this.init();
    const tx = this.db!.transaction('orders', 'readonly');
    const result = await new Promise<OrderRecord | undefined>((resolve, reject) => {
      const request = tx.objectStore('orders').get(orderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result;
  }

  async getAllOrders(): Promise<OrderRecord[]> {
    await this.init();
    const tx = this.db!.transaction('orders', 'readonly');
    const result = await new Promise<OrderRecord[]>((resolve, reject) => {
      const request = tx.objectStore('orders').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result;
  }

  async getUnsyncedOrders(): Promise<OrderRecord[]> {
    await this.init();
    const tx = this.db!.transaction('orders', 'readonly');
    const result = await new Promise<OrderRecord[]>((resolve, reject) => {
      const index = tx.objectStore('orders').index('isSynced');
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result;
  }

  async markOrderSynced(orderId: string): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('orders', 'readwrite');
    const order = await new Promise<OrderRecord | undefined>((resolve, reject) => {
      const request = tx.objectStore('orders').get(orderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (order) {
      order.isSynced = true;
      order.syncedAt = Date.now();
      const updateTx = this.db!.transaction('orders', 'readwrite');
      updateTx.objectStore('orders').put(order);
    }
  }

  // Menu Items
  async saveMenuItem(item: MenuItemRecord): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('menuItems', 'readwrite');
    await tx.objectStore('menuItems').put(item);
  }

  async saveMenuItems(items: MenuItemRecord[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('menuItems', 'readwrite');
    const store = tx.objectStore('menuItems');
    for (const item of items) {
      store.put(item);
    }
  }

  async getAllMenuItems(): Promise<MenuItemRecord[]> {
    await this.init();
    const tx = this.db!.transaction('menuItems', 'readonly');
    const result = await new Promise<MenuItemRecord[]>((resolve, reject) => {
      const request = tx.objectStore('menuItems').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result;
  }

  // Sync Queue
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').put(item);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.init();
    const tx = this.db!.transaction('syncQueue', 'readonly');
    const result = await new Promise<SyncQueueItem[]>((resolve, reject) => {
      const request = tx.objectStore('syncQueue').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result;
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').delete(id);
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').put(item);
  }

  // App State
  async setAppState(key: string, value: unknown): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('appState', 'readwrite');
    await tx.objectStore('appState').put({ key, value, updatedAt: Date.now() });
  }

  async getAppState<T>(key: string): Promise<T | undefined> {
    await this.init();
    const tx = this.db!.transaction('appState', 'readonly');
    const result = await new Promise<{ key: string; value: T; updatedAt: number } | undefined>((resolve, reject) => {
      const request = tx.objectStore('appState').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return result?.value;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.init();
    const stores = ['orders', 'menuItems', 'syncQueue', 'appState'];
    for (const storeName of stores) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
    }
  }

  // Get storage stats
  async getStats(): Promise<{ orders: number; menuItems: number; syncQueue: number }> {
    await this.init();
    const tx = this.db!.transaction(['orders', 'menuItems', 'syncQueue'], 'readonly');
    
    const ordersStore = tx.objectStore('orders');
    const menuStore = tx.objectStore('menuItems');
    const syncStore = tx.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const stats = { orders: 0, menuItems: 0, syncQueue: 0 };
      let completed = 0;

      ordersStore.count().onsuccess = () => {
        stats.orders = ordersStore.count().result;
        completed++;
        if (completed === 3) resolve(stats);
      };

      menuStore.count().onsuccess = () => {
        stats.menuItems = menuStore.count().result;
        completed++;
        if (completed === 3) resolve(stats);
      };

      syncStore.count().onsuccess = () => {
        stats.syncQueue = syncStore.count().result;
        completed++;
        if (completed === 3) resolve(stats);
      };

      tx.onerror = () => reject(tx.error);
    });
  }
}

export const offlineDB = new OfflineDatabase();
export { OfflineDatabase };
