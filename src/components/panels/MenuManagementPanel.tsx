'use client';

import { useState } from 'react';
import { useMenuStore, useUIStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { MenuItem, MenuCategory } from '@/types';

const CATEGORIES: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'hot_coffee', name: 'قهوه گرم', icon: '☕' },
  { id: 'cold_coffee', name: 'قهوه سرد', icon: '🧊' },
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

export function MenuManagementPanel() {
  const { isMenuManagementOpen, toggleMenuManagement } = useUIStore();
  const { items, toggleItemAvailability } = useMenuStore();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  if (!isMenuManagementOpen) return null;

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleToggleAvailability = (itemId: string) => {
    toggleItemAvailability(itemId);
    const item = items.find((i) => i.id === itemId);
    toast.success(
      item?.available ? `${item.name} غیرفعال شد` : `${item?.name} فعال شد`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={toggleMenuManagement}>
      <div
        className="absolute inset-4 md:inset-8 lg:inset-y-8 lg:inset-x-32 bg-[var(--color-surface)] rounded-3xl overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-xl font-bold text-white">مدیریت منو</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                فعال/غیرفعال کردن آیتم‌ها
              </p>
            </div>
          </div>
          <button
            onClick={toggleMenuManagement}
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
              همه ({items.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = items.filter((item) => item.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    نام
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    نام انگلیسی
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    دسته‌بندی
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    قیمت
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    وضعیت
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const category = CATEGORIES.find((c) => c.id === item.category);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-light)]/50 transition-colors ${
                        !item.available ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-white font-medium">{item.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[var(--color-text-secondary)]">{item.nameEn}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {category?.icon} {category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[var(--color-accent)] font-bold">
                          {formatPrice(item.price)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.available
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.available ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            item.available
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {item.available ? 'غیرفعال کن' : 'فعال کن'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-muted)]">آیتمی یافت نشد</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-light)]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-sm text-[var(--color-text-secondary)]">
                مجموع آیتم‌ها: <span className="font-bold text-white">{items.length}</span>
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                فعال:{' '}
                <span className="font-bold text-green-400">
                  {items.filter((i) => i.available).length}
                </span>
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                غیرفعال:{' '}
                <span className="font-bold text-red-400">
                  {items.filter((i) => !i.available).length}
                </span>
              </span>
            </div>
            <button
              onClick={toggleMenuManagement}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold rounded-xl hover:bg-[var(--color-accent-light)] transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
