'use client';

import { useState, useEffect } from 'react';
import { useMenuStore, useOrderStore, useAuthStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import type { MenuItem, MenuCategory, TakeawayOrderType } from '@/types';
import { toast } from 'sonner';
import { MENU_CATEGORIES } from '@/constants/categories';

const ORDER_TYPES: { value: TakeawayOrderType; label: string; icon: string }[] = [
  { value: 'phone', label: 'تلفنی', icon: '📞' },
  { value: 'snapfood', label: 'اسنپ‌فود', icon: '🥡' },
  { value: 'snapp', label: 'اسنپ', icon: '🚗' },
  { value: 'tourbon', label: 'توربون', icon: '🍽️' },
  { value: 'other', label: 'سایر', icon: '📋' },
];

export function TakeawayPanel() {
  const { items, loadMenu } = useMenuStore();
  const { currentOrder, addItemToOrder, addItemToNewOrder, removeItemFromOrder, updateItemQuantity, setCurrentOrder } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const [step, setStep] = useState<'items' | 'info'>('items');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderType, setOrderType] = useState<TakeawayOrderType>('phone');

  useEffect(() => {
    if (items.length === 0) loadMenu();
  }, [items.length, loadMenu]);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleAddItem = (item: MenuItem) => {
    if (!item.available) return;
    
    const itemData = {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
    };
    
    // If no current takeaway order exists, create one with this item
    if (!currentOrder || currentOrder.orderType !== 'takeaway') {
      addItemToNewOrder(itemData, 'takeaway', undefined, currentUser?.id || 0);
    } else {
      // Add to existing takeaway order
      addItemToOrder(itemData);
    }
  };

  const handleSubmitOrder = () => {
    if (!currentOrder || currentOrder.items.length === 0 || currentOrder.orderType !== 'takeaway') {
      toast.error('سفارشی وجود ندارد');
      return;
    }
    if (!address.trim()) {
      toast.error('لطفاً آدرس را وارد کنید');
      return;
    }

    // Update the takeaway order with customer info
    const orderToSubmit = useOrderStore.getState().orders.find(o => o.id === currentOrder.id);
    if (orderToSubmit) {
      // Update order with customer details and complete
      useOrderStore.getState().setCurrentOrder(null);
      toast.success('سفارش با موفقیت ثبت شد');
      setStep('items');
      setCustomerName('');
      setCustomerPhone('');
      setAddress('');
      setOrderType('phone');
    }
  };

  return (
    <div className="fixed left-0 top-16 bottom-16 w-[500px] bg-[var(--color-surface)] border-l border-[var(--color-border)] z-30 flex flex-col animate-slideRight">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h2 className="text-lg font-bold text-white">سفارش بیرون‌بر</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {step === 'items' ? 'مرحله ۱: انتخاب آیتم‌ها' : 'مرحله ۲: اطلاعات مشتری'}
            </p>
          </div>
        </div>
        <button onClick={() => setCurrentOrder(null)} className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg">
          ✕
        </button>
      </div>

      {/* Step Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setStep('items')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            step === 'items' ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
          }`}
        >
          ☕ انتخاب آیتم‌ها
        </button>
        <button
          onClick={() => currentOrder?.items.length && setStep('info')}
          disabled={!currentOrder?.items.length}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            step === 'info' ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
          } ${!currentOrder?.items.length ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📝 اطلاعات مشتری
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {step === 'items' ? (
          <>
            {/* Menu */}
            <div className="flex-1 overflow-y-auto p-3">
              {/* Categories */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                    !selectedCategory ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]' : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  همه
                </button>
                {MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      selectedCategory === cat.id ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]' : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-3 gap-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    disabled={!item.available}
                    className={`p-2 rounded-lg text-center transition-all ${
                      item.available ? 'bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-elevated)]' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xl mb-1">{MENU_CATEGORIES.find((c) => c.id === item.category)?.icon || '🍽️'}</div>
                    <p className="text-white text-xs font-medium line-clamp-1">{item.name}</p>
                    <p className="text-[var(--color-accent)] text-xs font-bold">{formatPrice(item.price)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="w-44 border-r border-[var(--color-border)] p-3 bg-[var(--color-surface-light)]/30 overflow-y-auto">
              <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                🛒 سبد
                <span className="bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-[10px] px-1.5 py-0.5 rounded-full">
                  {currentOrder?.items.length || 0}
                </span>
              </h3>

              {(!currentOrder || currentOrder.items.length === 0) ? (
                <p className="text-[var(--color-text-muted)] text-xs text-center py-4">آیتمی انتخاب نشده</p>
              ) : (
                <div className="space-y-1.5">
                  {currentOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-1.5 bg-[var(--color-surface-light)] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-[var(--color-accent)]">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-0.5 mr-1">
                        <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center bg-[var(--color-surface-elevated)] rounded text-white text-xs hover:bg-red-500/20">-</button>
                        <span className="w-5 text-center text-xs text-white">{item.quantity}</span>
                        <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center bg-[var(--color-surface-elevated)] rounded text-white text-xs hover:bg-green-500/20">+</button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-[var(--color-border)] pt-1.5 mt-1.5">
                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                      <span>جمع:</span>
                      <span className="font-bold text-white">{formatPrice(currentOrder.subtotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {currentOrder && currentOrder.items.length > 0 && (
                <button
                  onClick={() => setStep('info')}
                  className="w-full mt-2 py-2 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold rounded-lg text-xs hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  مرحله بعد ←
                </button>
              )}
            </div>
          </>
        ) : (
          /* Step 2: Customer Info */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3 max-w-md mx-auto">
              {/* Order Type */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">نوع سفارش</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ORDER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setOrderType(type.value)}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        orderType === type.value ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]' : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">نام مشتری</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام مشتری..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg text-white text-sm placeholder-[var(--color-text-muted)]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">شماره تماس</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="شماره تماس..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg text-white text-sm placeholder-[var(--color-text-muted)]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">آدرس <span className="text-red-400">*</span></label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="آدرس کامل..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg text-white text-sm placeholder-[var(--color-text-muted)] resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-3 bg-[var(--color-surface-light)] rounded-lg">
                <h4 className="text-sm font-bold text-white mb-2">خلاصه سفارش:</h4>
                <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex justify-between">
                    <span>تعداد آیتم‌ها:</span>
                    <span>{currentOrder?.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--color-accent)]">
                    <span>مبلغ کل:</span>
                    <span>{formatPrice(currentOrder?.subtotal || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {step === 'info' && (
        <div className="p-3 border-t border-[var(--color-border)] flex gap-2">
          <button onClick={() => setStep('items')} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg text-sm hover:bg-gray-500/30 transition-colors">
            ← بازگشت
          </button>
          <button
            onClick={handleSubmitOrder}
            disabled={!currentOrder?.items.length || !address.trim()}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm ${
              currentOrder?.items.length && address.trim() ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            🖨️ ثبت سفارش
          </button>
        </div>
      )}
    </div>
  );
}
