'use client';

import { useMemo } from 'react';
import { useOrderStore, useAuthStore, useTableStore } from '@/store';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

export function KitchenView() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { currentUser } = useAuthStore();
  const { updateTableStatus } = useTableStore();

  const kitchenOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'paid')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-orange-500 animate-pulse';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'جدید',
    preparing: 'در حال آماده‌سازی',
    ready: 'آماده',
  };

  const handleStartPreparing = (orderId: string, tableId: number) => {
    updateOrderStatus(orderId, 'preparing');
    updateTableStatus(tableId, 'preparing');
    toast.info('آماده‌سازی شروع شد');
  };

  const handleMarkReady = (orderId: string, tableId: number) => {
    updateOrderStatus(orderId, 'ready');
    updateTableStatus(tableId, 'occupied');
    toast.success('سفارش آماده شد!');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-light)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👨‍🍳</span>
            <div>
              <h2 className="text-xl font-bold text-white">آشپزخانه</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">{currentUser?.name}</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-orange-500/20 rounded-xl">
            <span className="text-orange-400 font-bold text-xl">{kitchenOrders.length}</span>
            <span className="text-[var(--color-text-secondary)] mr-1">سفارش</span>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto p-4">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
            <span className="text-6xl mb-4">🍽️</span>
            <p>سفارشی وجود ندارد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {kitchenOrders.map((order) => (
              <div key={order.id} className="bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/50">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                    <div>
                      <span className="text-white font-bold">میز {order.tableId}</span>
                      <span className="text-[var(--color-text-muted)] mr-2 text-sm">{formatTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(order.status)}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="p-4 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-[var(--color-surface)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍽️</span>
                        <div>
                          <p className="text-white font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.nameEn}</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-[var(--color-accent)]">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {order.status !== 'ready' && (
                  <div className="p-4 border-t border-[var(--color-border)]">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStartPreparing(order.id, order.tableId!)}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                      >
                        شروع آماده‌سازی
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleMarkReady(order.id, order.tableId!)}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                      >
                        آماده برای سرو
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
