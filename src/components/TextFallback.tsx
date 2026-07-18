'use client';

import { useUIStore, useTableStore } from '@/store';

export function TextFallback() {
  const { isTextMode, toggleTextMode } = useUIStore();
  const { tables, selectTable, selectedTableId } = useTableStore();

  if (!isTextMode) return null;

  const statusLabels: Record<string, string> = {
    available: 'خالی - آماده پذیرایی',
    occupied: 'اشغال شده',
    preparing: 'در حال آماده‌سازی',
    awaiting: 'در انتظار پرداخت',
    reserved: 'رزرو شده',
    cleaning: 'در حال تمیز کردن',
  };

  // Layout order: top row (5,6), middle row (1,2), bottom row (3,4)
  const layoutOrder = [5, 6, 1, 2, 3, 4];

  return (
    <div className="fixed inset-0 pt-32 pb-20 bg-[var(--bg-dark)] overflow-auto p-8" style={{ display: isTextMode ? 'block' : 'none' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">🍽️ Cafe Napoli - نمای جدول‌ها</h2>
        <p className="text-[var(--text-secondary)] mb-6">Alt+T برای تغییر حالت | کلیدهای جهت‌نما برای ناوبری</p>
        
        <div className="grid grid-cols-2 gap-4">
          {layoutOrder.map(tableId => {
            const table = tables.find(t => t.id === tableId);
            if (!table) return null;
            
            return (
              <button
                key={table.id}
                onClick={() => selectTable(table.id)}
                className={`p-4 rounded-xl border-2 text-right transition-all ${
                  selectedTableId === table.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-color)] hover:border-[var(--accent)]/50'
                }`}
              >
                <div className="text-xl font-bold">میز {table.id}</div>
                <div className={`text-sm ${
                  table.status === 'available' ? 'text-green-400' :
                  table.status === 'occupied' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {statusLabels[table.status]}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {table.group} - {table.seats} نفره
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
