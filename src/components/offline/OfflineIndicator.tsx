'use client';

import { useSyncStatus } from '@/lib/offline/syncManager';
import { offlineDB } from '@/lib/offline/indexedDB';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const status = useSyncStatus();
  const [stats, setStats] = useState<{ orders: number; menuItems: number; syncQueue: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const s = await offlineDB.getStats();
      setStats(s);
    };
    loadStats();
    
    // Refresh stats periodically
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status.isOnline && status.pendingCount === 0) {
    return null; // Don't show when everything is fine
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slideUp">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 min-w-[200px]">
        {/* Status Header */}
        <div className="flex items-center gap-3 mb-3">
          {!status.isOnline ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <span className="text-xl">📴</span>
              </div>
              <div>
                <p className="text-white font-bold">آفلاین</p>
                <p className="text-xs text-[var(--color-text-muted)]">سفارشات محلی ذخیره می‌شوند</p>
              </div>
            </>
          ) : status.isSyncing ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center animate-pulse">
                <span className="text-xl">🔄</span>
              </div>
              <div>
                <p className="text-white font-bold">در حال سینک</p>
                <p className="text-xs text-[var(--color-text-muted)]">{status.pendingCount} آیتم مانده</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
              <div>
                <p className="text-white font-bold">سینک معلق</p>
                <p className="text-xs text-[var(--color-text-muted)]">{status.pendingCount} آیتم</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">سفارشات محلی:</span>
              <span className="text-white">{stats.orders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">در صف سینک:</span>
              <span className="text-orange-400">{stats.syncQueue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">آیتم‌های منو:</span>
              <span className="text-white">{stats.menuItems}</span>
            </div>
          </div>
        )}

        {/* Last Sync */}
        {status.lastSyncAt && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              آخرین سینک: {new Date(status.lastSyncAt).toLocaleTimeString('fa-IR')}
            </p>
          </div>
        )}

        {/* Error */}
        {status.lastError && (
          <div className="mt-2 p-2 bg-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">خطا: {status.lastError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SyncButton() {
  const status = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing || !status.isOnline) return;
    
    setIsSyncing(true);
    const { syncManager } = await import('@/lib/offline/syncManager');
    await syncManager.syncAll();
    setIsSyncing(false);
  };

  return (
    <button
      onClick={handleSync}
      disabled={!status.isOnline || isSyncing}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        !status.isOnline
          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
          : isSyncing
          ? 'bg-blue-500/20 text-blue-400 cursor-wait'
          : 'bg-[var(--color-surface-light)] text-white hover:bg-[var(--color-surface-light)]/80'
      }`}
    >
      <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
      <span className="text-sm">
        {!status.isOnline ? 'آفلاین' : isSyncing ? 'سینک...' : 'سینک'}
      </span>
      {status.pendingCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
          {status.pendingCount}
        </span>
      )}
    </button>
  );
}

export default OfflineIndicator;
