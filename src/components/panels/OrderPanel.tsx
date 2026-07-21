'use client';

import { useState } from 'react';
import { useOrderStore, useAuthStore, ROLE_PERMISSIONS } from '@/store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export function OrderPanel() {
  const { currentOrder, removeItemFromOrder, updateItemQuantity, setCurrentOrder, completePayment, applyDiscount, cancelOrder } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');

  if (!currentOrder) return null;

  const canDeleteItem = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canDeleteItem;
  const canEditQuantity = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canEditQuantity;
  const canApplyDiscount = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canApplyDiscount;
  const canCancel = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canCancelOrder;

  const handleApplyDiscount = () => {
    const discount = parseInt(discountValue, 10);
    if (discount > 0 && discount <= 100) {
      applyDiscount(currentOrder.id, discount);
      setShowDiscount(false);
      setDiscountValue('');
      toast.success(`تخفیف ${discount}% اعمال شد`);
    }
  };

  const handlePayment = () => {
    completePayment(currentOrder.id, 'cash');
    toast.success('پرداخت با موفقیت انجام شد');
  };

  const handleCancel = () => {
    if (confirm('آیا از لغو سفارش مطمئن هستید؟')) {
      cancelOrder(currentOrder.id);
      toast.error('سفارش لغو شد');
    }
  };

  return (
    <div className="fixed bottom-20 left-6 w-96 max-h-[500px] panel flex flex-col z-20 animate-slideUp">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">
            {currentOrder.tableId ? `سفارش میز ${currentOrder.tableId}` : 'سفارش بیرون‌بر'}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {currentOrder.items.length} آیتم
          </p>
        </div>
        <button
          onClick={() => setCurrentOrder(null)}
          className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors text-[var(--color-text-secondary)]"
        >
          ✕
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentOrder.items.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-8">
            هنوز آیتمی اضافه نشده
          </p>
        ) : (
          <div className="space-y-3">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-light)] rounded-xl">
                <div className="flex-1">
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-sm text-[var(--color-accent)]">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canEditQuantity && (
                    <>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-elevated)] rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-elevated)] rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors"
                      >
                        +
                      </button>
                    </>
                  )}
                  {canDeleteItem && (
                    <button
                      onClick={() => removeItemFromOrder(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/20 rounded-lg transition-colors mr-2"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="text-left w-24">
                  <p className="font-bold text-[var(--color-accent)]">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {currentOrder.items.length > 0 && (
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-light)]/50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">جمع کل:</span>
              <span className="text-xl font-bold text-white">{formatPrice(currentOrder.subtotal)}</span>
            </div>
            
            {currentOrder.discount && currentOrder.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>تخفیف ({currentOrder.discountPercent}%):</span>
                <span>- {formatPrice(currentOrder.discount)}</span>
              </div>
            )}
            
            {!currentOrder.discount && canApplyDiscount && !showDiscount && (
              <button onClick={() => setShowDiscount(true)} className="text-sm text-blue-400 hover:text-blue-300">
                + اعمال تخفیف
              </button>
            )}
            
            {showDiscount && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="%"
                  className="w-20 px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white text-sm"
                />
                <span className="text-[var(--color-text-secondary)]">%</span>
                <button onClick={handleApplyDiscount} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30">اعمال</button>
                <button onClick={() => setShowDiscount(false)} className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30">انصراف</button>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="font-bold">مبلغ نهایی:</span>
              <span className="text-2xl font-bold text-[var(--color-accent)]">{formatPrice(currentOrder.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {canCancel && (
              <button onClick={handleCancel} className="px-4 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold transition-all">
                ✕ لغو
              </button>
            )}
            <button onClick={handlePayment} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <span>💳</span>
              <span>تکمیل پرداخت</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
