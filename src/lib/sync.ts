/**
 * Cross-Tab Synchronization Module
 * 
 * Provides real-time synchronization between browser tabs using:
 * 1. BroadcastChannel API - primary method for same-origin tab communication
 * 2. localStorage storage event - fallback for browsers without BroadcastChannel
 * 
 * This enables the "cafe management system" to work across multiple tabs/devices
 * without requiring a backend server.
 * 
 * Key Design Decisions:
 * - Uses BroadcastChannel for reliable cross-tab messaging
 * - localStorage events serve as a fallback and also trigger re-sync
 * - To prevent infinite loops: when we receive a localStorage event, we update state
 *   but DON'T broadcast again (the original broadcaster already did)
 * - Each store's sync handler merges remote state with local state
 */

export type SyncMessageType = 
  | 'TABLE_UPDATE'
  | 'ORDER_UPDATE'
  | 'AUTH_UPDATE'
  | 'AUDIT_UPDATE'
  | 'UI_UPDATE'
  | 'FULL_SYNC';

export interface SyncMessage {
  type: SyncMessageType;
  storeName: string;
  payload: unknown;
  timestamp: number;
  sourceTabId: string;
}

export interface SyncState {
  tables?: unknown[];
  orders?: unknown[];
  auth?: unknown;
  audit?: unknown[];
  ui?: unknown;
}

// Generate unique tab ID for this session
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Flag to track if we're currently processing a remote update
// This prevents infinite loops when we receive a storage event and update localStorage
let isProcessingRemoteUpdate = false;

class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<SyncMessageType, Set<(message: SyncMessage) => void>> = new Map();
  private isInitialized = false;
  private lastSyncTime = 0;
  private syncDebounceMs = 100; // Debounce sync events within 100ms window

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    // Initialize BroadcastChannel if available
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('napoli-sync');
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data);
      };
    }

    // Also listen to localStorage storage events as fallback/supplement
    window.addEventListener('storage', this.handleStorageEvent.bind(this));

    this.isInitialized = true;
    
    // Broadcast FULL_SYNC to let other tabs know we're ready and request their state
    setTimeout(() => {
      this.broadcastFullSync();
    }, 500);
  }

  private handleStorageEvent(event: StorageEvent) {
    // Only process keys we care about (the persist middleware keys)
    if (!event.key || !event.key.startsWith('napoli-')) return;
    if (event.key === 'napoli-sync-marker') return; // Ignore our sync marker
    
    const storeName = event.key.replace('napoli-', '');
    if (!['tables', 'orders', 'auth', 'audit', 'ui'].includes(storeName)) return;
    
    // Determine message type based on store
    let messageType: SyncMessageType;
    switch (storeName) {
      case 'tables': messageType = 'TABLE_UPDATE'; break;
      case 'orders': messageType = 'ORDER_UPDATE'; break;
      case 'auth': messageType = 'AUTH_UPDATE'; break;
      case 'audit': messageType = 'AUDIT_UPDATE'; break;
      case 'ui': messageType = 'UI_UPDATE'; break;
      default: return;
    }

    // Parse new value if present
    let payload: unknown = null;
    if (event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        // Zustand persist wraps state in a state property
        payload = parsed.state ?? parsed;
      } catch {
        payload = event.newValue;
      }
    }

    const message: SyncMessage = {
      type: messageType,
      storeName,
      payload,
      timestamp: Date.now(),
      sourceTabId: 'unknown',
    };

    // Set flag to prevent re-broadcasting this update
    isProcessingRemoteUpdate = true;
    this.notifyListeners(message);
    // Reset flag after a short delay to allow for batched updates
    setTimeout(() => {
      isProcessingRemoteUpdate = false;
    }, 50);
  }

  private handleMessage(message: SyncMessage) {
    // Ignore messages from self (via BroadcastChannel)
    if (message.sourceTabId === TAB_ID) return;

    // Debounce: ignore messages older than our last sync
    if (message.timestamp < this.lastSyncTime) return;
    this.lastSyncTime = message.timestamp;

    // Notify listeners about the update
    this.notifyListeners(message);
  }

  private notifyListeners(message: SyncMessage) {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in sync listener:', error);
        }
      });
    }
  }

  private sendMessage(message: SyncMessage) {
    // Only send via BroadcastChannel (localStorage events are handled by the browser)
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.error('Failed to send sync message:', error);
      }
    }
  }

  /**
   * Check if we're currently processing a remote update (to prevent loops)
   */
  isRemoteUpdateInProgress(): boolean {
    return isProcessingRemoteUpdate;
  }

  /**
   * Broadcast a state update to all other tabs
   */
  broadcast(type: SyncMessageType, storeName: string, payload: unknown) {
    const message: SyncMessage = {
      type,
      storeName,
      payload,
      timestamp: Date.now(),
      sourceTabId: TAB_ID,
    };
    this.sendMessage(message);
  }

  /**
   * Broadcast full state sync to all other tabs
   */
  broadcastFullSync() {
    // Read current state from localStorage
    const stores = ['tables', 'orders', 'auth', 'audit', 'ui'];
    const state: SyncState = {};

    for (const storeName of stores) {
      try {
        const data = localStorage.getItem(`napoli-${storeName}`);
        if (data) {
          const parsed = JSON.parse(data);
          switch (storeName) {
            case 'tables': state.tables = parsed.state?.tables ?? parsed.tables ?? []; break;
            case 'orders': state.orders = parsed.state?.orders ?? parsed.orders ?? []; break;
            case 'auth': state.auth = parsed.state ?? parsed; break;
            case 'audit': state.audit = parsed.state?.entries ?? parsed.entries ?? parsed ?? []; break;
            case 'ui': state.ui = parsed.state ?? parsed; break;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    const message: SyncMessage = {
      type: 'FULL_SYNC',
      storeName: 'global',
      payload: state,
      timestamp: Date.now(),
      sourceTabId: TAB_ID,
    };
    this.sendMessage(message);
  }

  /**
   * Subscribe to sync messages of a specific type
   */
  subscribe(type: SyncMessageType, callback: (message: SyncMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Get this tab's unique ID
   */
  getTabId(): string {
    return TAB_ID;
  }

  /**
   * Cleanup when tab is closed
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
let syncInstance: CrossTabSync | null = null;

export function getSync(): CrossTabSync {
  if (!syncInstance && typeof window !== 'undefined') {
    syncInstance = new CrossTabSync();
  }
  return syncInstance!;
}

// React hook for using sync in components
export function useSync() {
  return getSync();
}
