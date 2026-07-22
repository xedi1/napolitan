'use client';

import { useState, useRef } from 'react';
import { useMenuStore, useUIStore } from '@/store';
import { formatPrice, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { MenuItem, MenuCategory } from '@/types';

const CATEGORIES: { id: MenuCategory; name: string; nameEn: string; icon: string }[] = [
  { id: 'hot_coffee', name: 'قهوه گرم', nameEn: 'Hot Coffee', icon: '☕' },
  { id: 'cold_coffee', name: 'قهوه سرد', nameEn: 'Cold Coffee', icon: '🧊' },
  { id: 'hot_bar', name: 'بار گرم', nameEn: 'Hot Bar', icon: '🍫' },
  { id: 'tea', name: 'چای', nameEn: 'Tea', icon: '🍵' },
  { id: 'frappe', name: 'فراپه', nameEn: 'Frappe', icon: '🥤' },
  { id: 'shake_bar', name: 'شیک بار', nameEn: 'Shake Bar', icon: '🥛' },
  { id: 'mojito', name: 'موهیتو', nameEn: 'Mojito', icon: '🍹' },
  { id: 'baked_potato', name: 'سیب زمینی', nameEn: 'Baked Potato', icon: '🥔' },
  { id: 'italian_plate', name: 'پاستا', nameEn: 'Italian Plate', icon: '🍝' },
  { id: 'burger', name: 'برگر', nameEn: 'Burger', icon: '🍔' },
  { id: 'pizza', name: 'پیتزا', nameEn: 'Pizza', icon: '🍕' },
  { id: 'cake_dessert', name: 'کیک و دسر', nameEn: 'Cake & Dessert', icon: '🍰' },
];

interface NewItemForm {
  name: string;
  nameEn: string;
  categoryId: MenuCategory;
  price: number;
  description: string;
  image: string;
  available: boolean;
}

/**
 * MenuManagementPanel - Full menu item management with CRUD operations
 * - Add/Edit/Delete menu items
 * - Quick toggle availability (one tap)
 * - Drag to reorder within categories
 * - Image upload support
 */
export function MenuManagementPanel() {
  const { isMenuManagementOpen, toggleMenuManagement } = useUIStore();
  const { items, toggleItemAvailability, addItem, updateItem, removeItem, reorderItems } = useMenuStore();
  
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    nameEn: '',
    categoryId: 'hot_coffee',
    price: 0,
    description: '',
    image: '',
    available: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isMenuManagementOpen) return null;

  // Get items filtered by category (sorted by sortOrder)
  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory).sort((a, b) => a.sortOrder - b.sortOrder)
    : items.sort((a, b) => a.sortOrder - b.sortOrder);

  // Handle toggle availability (one tap)
  const handleToggleAvailability = (itemId: string) => {
    toggleItemAvailability(itemId);
    const item = items.find((i) => i.id === itemId);
    toast.success(
      item?.available ? `${item.name} غیرفعال شد` : `${item?.name} فعال شد`
    );
  };

  // Handle add new item
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast.error('نام آیتم را وارد کنید');
      return;
    }
    if (newItem.price <= 0) {
      toast.error('قیمت باید بیشتر از صفر باشد');
      return;
    }

    const categoryItems = items.filter((i) => i.category === newItem.categoryId);
    const maxSortOrder = Math.max(0, ...categoryItems.map((i) => i.sortOrder));
    const now = Date.now();

    const itemId = generateId(newItem.name);
    addItem({
      id: itemId,
      name: newItem.name.trim(),
      nameEn: newItem.nameEn.trim(),
      category: newItem.categoryId,
      price: newItem.price,
      description: newItem.description,
      image: newItem.image,
      available: newItem.available,
      sortOrder: maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    toast.success(`${newItem.name} اضافه شد`);
    setShowAddForm(false);
    setNewItem({
      name: '',
      nameEn: '',
      categoryId: 'hot_coffee',
      price: 0,
      description: '',
      image: '',
      available: true,
    });
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      toast.error('نام آیتم را وارد کنید');
      return;
    }

    updateItem(editingItem.id, {
      name: editingItem.name,
      nameEn: editingItem.nameEn,
      category: editingItem.category,
      price: editingItem.price,
      description: editingItem.description,
      image: editingItem.image,
      available: editingItem.available,
    });

    toast.success(`${editingItem.name} ویرایش شد`);
    setEditingItem(null);
  };

  // Handle delete
  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    const item = items.find((i) => i.id === itemToDelete);
    removeItem(itemToDelete);
    toast.success(`${item?.name} حذف شد`);
    setItemToDelete(null);
  };

  // Handle drag start
  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIdx = filteredItems.findIndex((i) => i.id === draggedItem);
    const targetIdx = filteredItems.findIndex((i) => i.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Reorder items
    const newItems = [...filteredItems];
    const [draggedItemData] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItemData);

    // Update sort orders
    reorderItems(newItems.map((item) => item.id), selectedCategory || 'hot_coffee');
    setDraggedItem(null);
    toast.success('ترتیب آیتم‌ها تغییر کرد');
  };

  // Handle image upload (placeholder - would use Supabase Storage in production)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, this would upload to Supabase Storage or Cloudflare Images
    // For now, create a local object URL
    const image = URL.createObjectURL(file);
    setNewItem({ ...newItem, image });
    toast.success('تصویر آپلود شد');
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
                افزودن، ویرایش، حذف و تغییر ترتیب آیتم‌ها
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all flex items-center gap-2"
            >
              ➕ افزودن آیتم
            </button>
            <button
              onClick={toggleMenuManagement}
              className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-light)]/50">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-lg font-bold text-white">افزودن آیتم جدید</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">نام فارسی *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="مثال: لاته"
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">نام انگلیسی</label>
                  <input
                    type="text"
                    value={newItem.nameEn}
                    onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                    placeholder="Example: Latte"
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">دسته‌بندی *</label>
                  <select
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value as MenuCategory })}
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">قیمت (تومان) *</label>
                  <input
                    type="number"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    placeholder="75000"
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-muted)]">توضیحات</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="توضیحات اختیاری درباره این آیتم..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder:text-[var(--color-text-muted)] resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white hover:bg-[var(--color-surface-light)] transition-all"
                  >
                    📷 آپلود تصویر
                  </button>
                  {newItem.image && (
                    <span className="text-sm text-green-400">✓ تصویر انتخاب شد</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-[var(--color-text-secondary)]">موجود:</span>
                    <div
                      onClick={() => setNewItem({ ...newItem, available: !newItem.available })}
                      className={`w-12 h-6 rounded-full transition-all cursor-pointer ${
                        newItem.available ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-all mt-0.5 ${
                          newItem.available ? 'mr-6' : 'mr-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all"
                >
                  ✓ افزودن
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItem({
                      name: '',
                      nameEn: '',
                      categoryId: 'hot_coffee',
                      price: 0,
                      description: '',
                      image: '',
                      available: true,
                    });
                  }}
                  className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-surface-light)] transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Items List (Draggable) */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedCategory && (
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              💡 برای تغییر ترتیب، آیتم‌ها را بکشید و رها کنید
            </p>
          )}
          
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const category = CATEGORIES.find((c) => c.id === item.category);
              return (
                <div
                  key={item.id}
                  draggable={!!selectedCategory}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                    ${selectedCategory ? 'border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-surface-light)]/30' : 'border-transparent'}
                    ${draggedItem === item.id ? 'opacity-50 scale-95' : ''}
                    ${!item.available ? 'opacity-60' : ''}
                  `}
                  onClick={() => setEditingItem(item)}
                >
                  {/* Drag Handle */}
                  {selectedCategory && (
                    <div className="text-[var(--color-text-muted)] cursor-grab">☰</div>
                  )}

                  {/* Sort Order */}
                  <span className="text-[var(--color-text-muted)] text-sm w-6">{index + 1}</span>

                  {/* Image */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-2xl">
                      {category?.icon}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    {item.nameEn && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{item.nameEn}</p>
                    )}
                  </div>

                  {/* Category */}
                  <span className="text-sm text-[var(--color-text-secondary)] hidden sm:block">
                    {category?.icon} {category?.name}
                  </span>

                  {/* Price */}
                  <span className="text-[var(--color-accent)] font-bold whitespace-nowrap">
                    {formatPrice(item.price)}
                  </span>

                  {/* Quick Toggle (One Tap) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAvailability(item.id);
                    }}
                    className={`
                      relative w-14 h-7 rounded-full transition-all flex-shrink-0
                      ${item.available ? 'bg-green-500' : 'bg-red-500'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all
                        ${item.available ? 'right-1' : 'left-1'}
                      `}
                    />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(item.id);
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-muted)]">
                {selectedCategory ? 'آیتمی در این دسته‌بندی نیست' : 'آیتمی یافت نشد'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-light)]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-sm text-[var(--color-text-secondary)]">
                مجموع: <span className="font-bold text-white">{items.length}</span>
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                فعال: <span className="font-bold text-green-400">{items.filter((i) => i.available).length}</span>
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                غیرفعال: <span className="font-bold text-red-400">{items.filter((i) => !i.available).length}</span>
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

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="panel p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">ویرایش {editingItem.name}</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">نام فارسی *</label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">نام انگلیسی</label>
                    <input
                      type="text"
                      value={editingItem.nameEn || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">دسته‌بندی</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MenuCategory })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">قیمت (تومان)</label>
                    <input
                      type="number"
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">توضیحات</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={2}
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-[var(--color-text-secondary)]">موجود:</span>
                    <div
                      onClick={() => setEditingItem({ ...editingItem, available: !editingItem.available })}
                      className={`w-12 h-6 rounded-full transition-all cursor-pointer ${
                        editingItem.available ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-all mt-0.5 ${
                          editingItem.available ? 'mr-6' : 'mr-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-bold rounded-xl transition-all"
                >
                  ✓ ذخیره
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-[var(--color-surface-light)] text-white rounded-xl hover:bg-[var(--color-surface-elevated)] transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="panel p-6 w-80 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-white mb-2">حذف آیتم؟</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                آیا از حذف این آیتم اطمینان دارید؟
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteItem}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
                >
                  ✓ بله، حذف شود
                </button>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 bg-[var(--color-surface-light)] text-white rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
