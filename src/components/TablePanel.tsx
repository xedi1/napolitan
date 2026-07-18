'use client';

import { useTableStore, useOrderStore, useAuditStore, useAuthStore } from '@/store';
import { formatPrice } from '@/lib/utils';

export function TablePanel() {
  const { tables, selectedTableId, selectTable, setTableStatus } = useTableStore();
  const { orders, addOrder, setCurrentOrder } = useOrderStore();
  const { addEntry } = useAuditStore();
  const { currentUser } = useAuthStore();

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableOrder = orders.find(o => o.tableId === selectedTableId);

  const handleStatusChange = (status: typeof selectedTable.status) => {
    if (selectedTable) {
      setTableStatus(selectedTable.id, status);
      addEntry({
        userId: currentUser?.id || 0,
        userName: currentUser?.name || 'سیستم',
        userRole: currentUser?.role || 'waiter',
        action: 'تغییر وضعیت',
        actionType: 'status',
        details: `میز ${selectedTable.id} به وضعیت ${status} تغییر کرد`,
        tableId: selectedTable.id,
      });
    }
  };

  const handleNewOrder = () => {
    if (selectedTable) {
      const newOrder = {
        id: `order-${Date.now()}`,
        tableId: selectedTable.id,
        items: [],
        status: 'pending' as const,
        subtotal: 0,
        total: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: currentUser?.id || 0,
      };
      addOrder(newOrder);
      setCurrentOrder(newOrder);
      setTableStatus(selectedTable.id, 'occupied');
    }
  };

  if (!selectedTableId) return null;

  const statusLabels: Record<string, string> = {
    available: 'خالی',
    occupied: 'اشغال',
    preparing: 'آماده‌سازی',
    awaiting: 'در انتظار',
    reserved: 'رزرو',
    cleaning: 'تمیزکاری',
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 panel p-4 z-20 animate-enter">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">میز {selectedTable.id}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{selectedTable.group}</p>
        </div>
        <button
          onClick={() => selectTable(null)}
          className="p-2 hover:bg-[var(--bg-dark)] rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <p className="text-xs text-[var(--text-muted)] mb-2">وضعیت:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as typeof selectedTable.status)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedTable.status === key
                  ? 'bg-[var(--accent)] text-black'
                  : 'bg-[var(--bg-dark)] hover:bg-[var(--accent)]/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Info */}
      {tableOrder ? (
        <div className="mb-4 p-3 bg-[var(--bg-dark)] rounded-lg">
          <p className="text-sm font-medium mb-2">سفارش فعلی:</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {tableOrder.items.length} آیتم - {formatPrice(tableOrder.total)}
          </p>
        </div>
      ) : (
        <button
          onClick={handleNewOrder}
          className="w-full btn-primary mb-4"
        >
          ثبت سفارش جدید
        </button>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="flex-1 btn-secondary text-sm">
          نمایش منو
        </button>
        <button className="flex-1 btn-secondary text-sm">
          پرینت
        </button>
      </div>
    </div>
  );
}
