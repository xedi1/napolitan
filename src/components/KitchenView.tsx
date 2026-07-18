'use client';

import { useState, useEffect, useMemo } from 'react';
import { useOrderStore, useAuthStore } from '@/store';
import { formatPrice, formatTime } from '@/lib/utils';
import { fetchMenuData, type MenuItemData } from '@/lib/data';

type BarFilter = 'all' | 'cold' | 'hot';

export function KitchenView() {
  const { orders, updateOrder } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [barFilter, setBarFilter] = useState<BarFilter>('all');

  useEffect(() => {
    fetchMenuData().then(data => {
      if (data) {
        setMenuItems(data.items);
      }
    });
  }, []);

  // Get item category for filtering
  const getItemBarType = (category: string): 'cold' | 'hot' => {
    return category === 'cold' ? 'cold' : 'hot';
  };

  // Filter orders that have items for kitchen
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(order => {
        if (order.status === 'cancelled' || order.status === 'paid') return false;
        
        // Filter by bar type if selected
        if (barFilter !== 'all') {
          const hasMatchingItems = order.items.some(item => {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            if (!menuItem) return false;
            return getItemBarType(menuItem.category) === barFilter;
          });
          return hasMatchingItems;
        }
        
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, barFilter, menuItems]);

  // Get items for a specific bar type within an order
  const getOrderItemsByBar = (order: typeof orders[0], bar: BarFilter) => {
    if (bar === 'all') {
      return order.items.filter(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return false;
        // Kitchen sees everything except pure coffee (bar hot takes coffee too, cold takes cold drinks)
        return menuItem.category !== 'coffee'; // Kitchen doesn't handle pure coffee orders
      });
    }
    
    return order.items.filter(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      if (!menuItem) return false;
      return getItemBarType(menuItem.category) === bar && menuItem.category !== 'coffee';
    });
  };

  const handleUpdateStatus = (orderId: string, status: typeof orders[0]['status']) => {
    updateOrder(orderId, { status });
  };

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
    delivered: 'تحویل داده شد',
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-dark)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍🍳</span>
            <div>
              <h2 className="text-xl font-bold text-white">آشپزخانه</h2>
              <p className="text-sm text-[var(--text-secondary)]">{currentUser?.name}</p>
            </div>
          </div>
          
          {/* Order count */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-orange-500/20 rounded-xl">
              <span className="text-orange-400 font-bold">{kitchenOrders.length}</span>
              <span className="text-[var(--text-secondary)] mr-1">سفارش</span>
            </div>
          </div>
        </div>

        {/* Bar Filter Tabs */}
        <div className="flex gap-2">
          <FilterTab
            active={barFilter === 'all'}
            onClick={() => setBarFilter('all')}
            icon="🍳"
            label="همه"
            color="text-[var(--accent)]"
          />
          <FilterTab
            active={barFilter === 'cold'}
            onClick={() => setBarFilter('cold')}
            icon="🧊"
            label="بار سرد"
            color="text-cyan-400"
          />
          <FilterTab
            active={barFilter === 'hot'}
            onClick={() => setBarFilter('hot')}
            icon="🔥"
            label="بار گرم"
            color="text-orange-400"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
            <span className="text-6xl mb-4">🍽️</span>
            <p>سفارشی وجود ندارد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {kitchenOrders.map(order => {
              const kitchenItems = getOrderItemsByBar(order, barFilter);
              if (kitchenItems.length === 0) return null;
              
              return (
                <div
                  key={order.id}
                  className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-color)] overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-dark)]/50">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full ${getStatusColor(order.status)}" />
                      <div>
                        <span className="text-white font-bold">میز {order.tableId}</span>
                        <span className="text-[var(--text-muted)] mr-2 text-sm">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(order.status)}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 space-y-3">
                    {kitchenItems.map(item => {
                      const menuItem = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--bg-dark)] rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-[var(--accent)]/20 rounded-lg text-lg">
                              {menuItem?.category === 'food' ? '🍔' : 
                               menuItem?.category === 'dessert' ? '🍰' : '🧊'}
                            </span>
                            <div>
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {menuItem?.nameEn}
                              </p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-[var(--accent)]">
                            ×{item.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  {order.status !== 'ready' && order.status !== 'delivered' && (
                    <div className="p-4 border-t border-[var(--border-color)]">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                        >
                          شروع آماده‌سازی
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                        >
                          آماده برای سرو
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  icon,
  label,
  color
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        active
          ? `bg-[var(--accent)] text-black font-bold`
          : `bg-[var(--bg-dark)] text-[var(--text-secondary)] hover:${color}`
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
