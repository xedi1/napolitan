'use client';

import { useState, useEffect } from 'react';
import { useMenuStore, useOrderStore, useAuthStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import type { MenuItem, MenuCategory } from '@/types';
import { toast } from 'sonner';
import { webSync } from '@/lib/webSync';

// Use same categories as dataProvider to ensure consistency
const CATEGORIES: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'hot_coffee', name: 'قهوه گرم', icon: '☕' },
  { id: 'cold_coffee', name: 'قهوه سرد', icon: '🧊' },
  { id: 'drip_coffee', name: 'قهوه دمی', icon: '🫖' },
  { id: 'hot_bar', name: 'بار گرم', icon: '🍵' },
  { id: 'tea', name: 'چای', icon: '🍃' },
  { id: 'frappe', name: 'گلاسه', icon: '🥤' },
  { id: 'shake_bar', name: 'شیک بار', icon: '🥛' },
  { id: 'mojito', name: 'ماکتیل', icon: '🍹' },
  { id: 'baked_potato', name: 'سیب زمینی', icon: '🥔' },
  { id: 'italian_plate', name: 'بشقاب ایتالیایی', icon: '🍝' },
  { id: 'burger', name: 'برگر', icon: '🍔' },
  { id: 'pizza', name: 'پیتزا', icon: '🍕' },
  { id: 'cake_dessert', name: 'دسر', icon: '🍰' },
];

// Helper to get category icon
const getCategoryIcon = (category: MenuCategory): string => {
  return CATEGORIES.find((c) => c.id === category)?.icon || '🍽️';
};

export function MenuModal() {
  const { items, loadMenu, isLoading, toggleItemAvailability } = useMenuStore();
  const { currentOrder, addItemToOrder, addItemToNewOrder } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Only manager and kitchen can toggle availability
  const canToggleAvailability = currentUser?.role === 'manager' || currentUser?.role === 'kitchen';

  // Load menu only when modal is OPEN and items are empty (prevents wasteful network requests)
  useEffect(() => {
    if (isOpen && items.length === 0 && !isLoading) {
      loadMenu();
    }
  }, [isOpen, items.length, isLoading, loadMenu]);

  // Safe filtering with defensive checks
  const safeItems = Array.isArray(items) ? items : [];
  
  const filteredItems = selectedCategory
    ? safeItems.filter((item) => item && item.category === selectedCategory)
    : safeItems;
  
  // Determine display state
  const isLoadingState = isLoading && safeItems.length === 0;
  const isEmptyState = !isLoading && safeItems.length === 0;
  const isFilteredEmpty = !isLoading && safeItems.length > 0 && filteredItems.length === 0;

  const handleAddItem = (item: MenuItem) => {
    if (!item || !item.available) return;
    
    const itemData = {
      menuItemId: item.id,
      name: item.name || 'نامعلوم',
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: 1,
      category: item.category,
    };
    
    // If there's an active order, add to it
    if (currentOrder) {
      addItemToOrder(itemData);
    } else {
      // No current order - create a new takeaway order and add the item
      // (takeaway is the default since MenuModal is typically used for quick additions)
      addItemToNewOrder(itemData, 'takeaway', undefined, currentUser?.id || 0);
    }
    
    toast.success(`${item.name} اضافه شد`);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!canToggleAvailability) return;
    
    // Toggle locally first for immediate feedback
    toggleItemAvailability(item.id);
    
    // Then sync to web (Supabase)
    webSync.syncToggleMenuItemAvailability(item.id).catch(console.error);
    
    toast.success(
      item.available 
        ? `${item.name} غیرفعال شد` 
        : `${item.name} فعال شد`
    );
  };

  return (
    <>
      {/* Floating Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <span className="text-xl">📋</span>
        <span>منو</span>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="absolute inset-4 md:inset-8 lg:inset-16 bg-[var(--color-surface)] rounded-3xl overflow-hidden flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">منوی کافه ناپلitan</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-[var(--color-border)] overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    !selectedCategory
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  همه
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                        : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading State */}
              {isLoadingState && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--color-text-secondary)]">در حال بارگذاری منو...</p>
                  </div>
                </div>
              )}
              
              {/* Empty State - No items in store */}
              {isEmptyState && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-[var(--color-text-muted)]">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-lg font-medium mb-2">منو خالی است</p>
                    <p className="text-sm">آیتمی در منو وجود ندارد</p>
                  </div>
                </div>
              )}
              
              {/* Filtered Empty - Items exist but none match category */}
              {isFilteredEmpty && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-[var(--color-text-muted)]">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg font-medium mb-2">آیتمی یافت نشد</p>
                    <p className="text-sm">هیچ آیتمی در این دسته‌بندی وجود ندارد</p>
                  </div>
                </div>
              )}
              
              {/* Items Grid */}
              {!isLoadingState && !isEmptyState && filteredItems.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredItems.map((item) => {
                    // Skip invalid items defensively
                    if (!item || !item.id || !item.name) return null;
                    
                    return (
                      <div
                        key={item.id}
                        className={`relative p-4 rounded-xl text-right transition-all ${
                          item.available
                            ? 'bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-elevated)]'
                            : 'bg-[var(--color-surface-light)]/50 opacity-50'
                        }`}
                      >
                        {/* Toggle Availability Button - only for manager/kitchen */}
                        {canToggleAvailability && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAvailability(item);
                            }}
                            className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              item.available
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            title={item.available ? 'غیرفعال کردن' : 'فعال کردن'}
                          >
                            {item.available ? '👁️' : '🚫'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleAddItem(item)}
                          disabled={!item.available}
                          className={`w-full text-right ${!item.available ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className="text-2xl mb-2">{getCategoryIcon(item.category)}</div>
                          <p className="text-white font-medium text-sm mb-1 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{item.nameEn || ''}</p>
                          <p className="text-[var(--color-accent)] font-bold mt-2">{formatPrice(item.price)}</p>
                          {!item.available && (
                            <span className="text-xs text-red-400">ناموجود</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
