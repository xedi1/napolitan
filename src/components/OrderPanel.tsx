'use client';

import { useOrderStore, useAuthStore, ROLE_PERMISSIONS } from '@/store';
import { formatPrice } from '@/lib/utils';

export function OrderPanel() {
  const { currentOrder, removeItemFromCurrentOrder, updateItemQuantity, setCurrentOrder } = useOrderStore();
  const { currentUser } = useAuthStore();

  const canDeleteItem = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canDeleteItem;

  if (!currentOrder) return null;

  const handleClose = () => {
    setCurrentOrder(null);
  };

  return (
    <div className="fixed bottom-20 left-6 w-96 max-h-[500px] panel flex flex-col z-20 animate-enter">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">سفارش میز {currentOrder.tableId}</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {currentOrder.items.length} آیتم
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-[var(--bg-dark)] rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentOrder.items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-8">
            هنوز آیتمی اضافه نشده
          </p>
        ) : (
          <div className="space-y-3">
            {currentOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-[var(--bg-dark)] rounded-xl"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-sm text-[var(--accent)]">
                    {formatPrice(item.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-[var(--bg-panel)] rounded-lg hover:bg-[var(--accent)]/20 transition-colors"
                    disabled={!canDeleteItem}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-[var(--bg-panel)] rounded-lg hover:bg-[var(--accent)]/20 transition-colors"
                    disabled={!canDeleteItem}
                  >
                    +
                  </button>
                  {canDeleteItem && (
                    <button
                      onClick={() => removeItemFromCurrentOrder(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/20 rounded-lg transition-colors mr-2"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Item Total */}
                <div className="text-left w-24">
                  <p className="font-bold text-[var(--accent)]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      {currentOrder.items.length > 0 && (
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-dark)]/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--text-secondary)]">جمع کل:</span>
            <span className="text-xl font-bold text-white">
              {formatPrice(currentOrder.subtotal)}
            </span>
          </div>
          {currentOrder.discount && currentOrder.discount > 0 && (
            <div className="flex justify-between items-center mb-2 text-green-400">
              <span>تخفیف:</span>
              <span>- {formatPrice(currentOrder.discount)}</span>
            </div>
          )}
          {currentOrder.tax && currentOrder.tax > 0 && (
            <div className="flex justify-between items-center mb-2 text-[var(--text-secondary)]">
              <span>مالیات:</span>
              <span>+ {formatPrice(currentOrder.tax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]">
            <span className="font-bold">مبلغ نهایی:</span>
            <span className="text-2xl font-bold text-[var(--accent)]">
              {formatPrice(currentOrder.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
