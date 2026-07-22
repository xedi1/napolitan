'use client';

import { useServiceWorker } from '@/lib/offline/usePWA';
import { toast } from 'sonner';

export function PWAUpdateNotification() {
  const { updateAvailable, skipWaiting } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideDown">
      <div className="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-2xl shadow-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <p className="text-white font-bold">آپدیت جدید موجود!</p>
            <p className="text-xs text-[var(--color-text-muted)]">برای دریافت رفرش کنید</p>
          </div>
          <button
            onClick={() => {
              skipWaiting();
              window.location.reload();
            }}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-accent)]/80 transition-colors"
          >
            رفرش
          </button>
        </div>
      </div>
    </div>
  );
}

export function PWAInstallPrompt() {
  const { canInstall, install, isInstalled } = require('@/lib/offline/usePWA').usePWAInstall();

  if (!canInstall || isInstalled) return null;

  return (
    <button
      onClick={install}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-[var(--color-accent)] text-white rounded-2xl shadow-2xl hover:bg-[var(--color-accent)]/80 transition-all"
    >
      <span className="text-xl">📲</span>
      <span className="font-bold">نصب اپ</span>
    </button>
  );
}

export default PWAUpdateNotification;
