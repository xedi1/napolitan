'use client';

import { useDeliveryOrders, DeliveryOrder, PLATFORM_LABELS, STATUS_LABELS, formatCurrency } from '@/lib/deliveryOrders';
import { toast } from 'sonner';
import { useUIStore } from '@/store';

export function DeliveryOrdersPanel() {
  const { orders, isLoading, error, refreshOrders, updateOrderStatus, pendingCount, todayRevenue, addDemoOrder } = useDeliveryOrders();
  const { toggleDeliveryOrders } = useUIStore();

  const handleStatusUpdate = async (orderId: string, newStatus: DeliveryOrder['status']) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`سفارش به "${STATUS_LABELS[newStatus]}" تغییر کرد`);
  };

  const getPlatformIcon = (platform: DeliveryOrder['platform']) => {
    return PLATFORM_LABELS[platform]?.icon || '📦';
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-black';
      case 'preparing': return 'bg-orange-500 text-white';
      case 'ready': return 'bg-green-500 text-white';
      case 'delivered': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📦</div>
          <p className="text-[var(--color-text-secondary)]">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refreshOrders}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-light)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleDeliveryOrders} className="p-2 hover:bg-[var(--color-surface)] rounded-xl">
              <span className="text-2xl">✕</span>
            </button>
            <span className="text-4xl">🚴</span>
            <div>
              <h2 className="text-xl font-bold text-white">سفارشات آنلاین</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {orders.length} سفارش | {formatCurrency(todayRevenue)} امروز
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <div className="px-3 py-1 bg-yellow-500/20 rounded-xl flex items-center gap-2">
                <span className="text-yellow-400 animate-pulse">🔔</span>
                <span className="text-yellow-400 font-bold">{pendingCount}</span>
              </div>
            )}
            <button
              onClick={addDemoOrder}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/30"
              title="افزودن سفارش دمو"
            >
              ➕ دمو
            </button>
            <button
              onClick={refreshOrders}
              className="p-2 hover:bg-[var(--color-surface)] rounded-xl transition-colors"
              title="بروزرسانی"
            >
              <span className="text-xl">🔄</span>
            </button>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {(['snapfood', 'tapsifood', 'tourbon'] as const).map((platform) => {
            const count = orders.filter(o => o.platform === platform).length;
            return (
              <div
                key={platform}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] rounded-xl whitespace-nowrap"
              >
                <span>{PLATFORM_LABELS[platform].icon}</span>
                <span className="text-white text-sm">{PLATFORM_LABELS[platform].name}</span>
                <span className="text-[var(--color-text-muted)] text-xs">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-[var(--color-text-secondary)]">سفارش آنلاینی نیست</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(order.platform)}</span>
                      <span className="text-white font-bold">
                        {PLATFORM_LABELS[order.platform].name}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">
                      #{order.externalId}
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--color-text-muted)]">👤</span>
                    <span className="text-white">{order.customerName || 'نامعلوم'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--color-text-muted)]">📞</span>
                    <span className="text-white direction-ltr">{order.customerPhone || 'نامعلوم'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--color-text-muted)]">📍</span>
                    <span className="text-white text-sm flex-1">{order.address}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded text-xs font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-white">{item.name}</span>
                        </div>
                        <span className="text-[var(--color-text-muted)]">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total & Actions */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-accent)]">
                      {formatCurrency(order.total)}
                    </p>
                    {order.paymentMethod === 'online' && (
                      <span className="text-xs text-green-400">💳 آنلاین</span>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
                        >
                          شروع آماده‌سازی
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-colors"
                        >
                          لغو
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                        >
                          آماده!
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-colors"
                        >
                          لغو
                        </button>
                      </>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                      >
                        تحویل داده شد
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] p-2 rounded-lg">
                      📝 {order.notes}
                    </p>
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

export default DeliveryOrdersPanel;
