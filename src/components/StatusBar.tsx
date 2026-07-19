'use client';

import { useTableStore } from '@/store';

export function StatusBar() {
  const { tables } = useTableStore();

  const statusCounts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    preparing: tables.filter(t => t.status === 'preparing').length,
    awaiting: tables.filter(t => t.status === 'awaiting').length,
    eating: tables.filter(t => t.status === 'eating').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };

  return (
    <div className="fixed top-16 left-0 right-0 h-12 bg-[var(--bg-panel)]/80 backdrop-blur-xl border-b border-[var(--border-color)] z-30 flex items-center justify-center gap-6 overflow-x-auto">
      <StatusItem count={statusCounts.available} label="خالی" color="available" />
      <StatusItem count={statusCounts.occupied} label="اشغال" color="occupied" />
      <StatusItem count={statusCounts.preparing} label="آماده‌سازی" color="preparing" />
      <StatusItem count={statusCounts.awaiting} label="در انتظار" color="awaiting" />
      <StatusItem count={statusCounts.eating} label="در حال صرف" color="eating" />
      <StatusItem count={statusCounts.reserved} label="رزرو" color="reserved" />
      <StatusItem count={statusCounts.cleaning} label="تمیزکاری" color="cleaning" />
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  occupied: '#ef4444',
  preparing: '#f59e0b',
  awaiting: '#a855f7',
  eating: '#3b82f6',
  reserved: '#6366f1',
  cleaning: '#10b981',
};

function StatusItem({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: STATUS_COLORS[color] || '#4ADE80' }} />
      <span className="text-sm font-bold text-white">{count}</span>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}
