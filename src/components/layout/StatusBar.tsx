'use client';

import { useTableStore } from '@/store';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export function StatusBar() {
  const { tables } = useTableStore();

  const statusCounts = {
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    preparing: tables.filter((t) => t.status === 'preparing').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    cleaning: tables.filter((t) => t.status === 'cleaning').length,
  };

  const statuses = [
    { key: 'available', label: 'آزاد', count: statusCounts.available, color: 'bg-green-500' },
    { key: 'occupied', label: 'اشغال', count: statusCounts.occupied, color: 'bg-red-500' },
    { key: 'preparing', label: 'در آماده‌سازی', count: statusCounts.preparing, color: 'bg-orange-500' },
    { key: 'reserved', label: 'رزرو', count: statusCounts.reserved, color: 'bg-yellow-500' },
    { key: 'cleaning', label: 'تمیزکاری', count: statusCounts.cleaning, color: 'bg-cyan-500' },
  ];

  return (
    <div className="h-12 bg-[var(--color-surface-light)] border-b border-[var(--color-border)] px-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {statuses.map((status) => (
          <div key={status.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.color} ${status.count > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-[var(--color-text-secondary)]">{status.label}:</span>
            <span className="text-sm font-bold text-white">{status.count}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        مجموع میزها: <span className="font-bold text-white">{tables.length}</span>
      </div>
    </div>
  );
}
