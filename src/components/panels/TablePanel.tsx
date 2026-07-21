'use client';

import { useTableStore, useUIStore, useOrderStore } from '@/store';
import { formatPrice, getStatusLabel } from '@/lib/utils';

export function TablePanel() {
  const { selectedTableId, selectTable, tables } = useTableStore();
  const { selectedFloor } = useUIStore();
  const { setCurrentOrder } = useOrderStore();

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  if (!selectedTableId || !selectedTable) return null;

  const handleClose = () => selectTable(null);

  const handleNewOrder = () => {
    setCurrentOrder(null);
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 panel z-20 animate-slideUp">
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">میز {selectedTable.id}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {selectedTable.seats} نفره • {selectedTable.shape === 'circle' ? 'گرد' : 'مستطیل'}
          </p>
        </div>
        <button onClick={handleClose} className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div>
          <label className="text-xs text-[var(--color-text-muted)] mb-1 block">وضعیت:</label>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-light)] text-white font-medium`}>
            <span className={`w-2 h-2 rounded-full ${
              selectedTable.status === 'available' ? 'bg-green-500' :
              selectedTable.status === 'occupied' ? 'bg-red-500' :
              selectedTable.status === 'preparing' ? 'bg-orange-500' :
              selectedTable.status === 'reserved' ? 'bg-yellow-500' :
              'bg-cyan-500'
            }`} />
            {getStatusLabel(selectedTable.status)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={handleNewOrder}
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>ثبت سفارش جدید</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-all text-sm">
              تغییر وضعیت
            </button>
            <button className="py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-all text-sm">
              رزرو میز
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
