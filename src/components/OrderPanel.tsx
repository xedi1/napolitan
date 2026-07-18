'use client';

import { useOrderStore } from '@/store';

export function OrderPanel() {
  const { currentOrder } = useOrderStore();

  if (!currentOrder) return null;

  return (
    <div className="fixed bottom-20 left-6 w-80 panel p-4 z-20 animate-enter">
      <h3 className="text-lg font-bold mb-4">سفارش میز {currentOrder.tableId}</h3>
      {/* Order content here */}
      <p className="text-sm text-[var(--text-secondary)]">آیتم‌های سفارش</p>
    </div>
  );
}
