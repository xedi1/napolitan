'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useAuditStore } from '@/store';
import { showToast } from '@/components/ToastContainer';
import type { MenuItemData, MenuData } from '@/lib/data';

const CATEGORIES = ['coffee', 'cold', 'dessert', 'food'] as const;

interface MenuItemFormData {
  id: string;
  name: string;
  nameEn: string;
  category: typeof CATEGORIES[number];
  price: number;
  description: string;
  image: string;
  available: boolean;
}

const emptyForm: MenuItemFormData = {
  id: '',
  name: '',
  nameEn: '',
  category: 'coffee',
  price: 0,
  description: '',
  image: '',
  available: true,
};

export function MenuManagement() {
  const { currentUser } = useAuthStore();
  const { addEntry } = useAuditStore();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItemFormData | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      const response = await fetch('/data/menu.json');
      const data: MenuData = await response.json();
      setMenuData(data);
      setItems(data.items);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      showToast('خطا در بارگذاری منو', 'error');
    }
  };

  const handleSaveItem = () => {
    if (!editingItem) return;

    if (!editingItem.name || !editingItem.price) {
      showToast('نام و قیمت الزامی است', 'error');
      return;
    }

    let newItems: MenuItemData[];
    if (isAddingNew) {
      const newItem: MenuItemData = {
        ...editingItem,
        id: `item-${Date.now()}`,
        image: editingItem.image || '/images/menu/default.jpg',
      };
      newItems = [...items, newItem];
      showToast(`${newItem.name} اضافه شد`, 'success');
      addEntry({
        userId: currentUser?.id || 0,
        userName: currentUser?.name || 'مدیر',
        userRole: currentUser?.role || 'manager',
        action: 'افزودن آیتم منو',
        actionType: 'status',
        details: `آیتم "${newItem.name}" به منو اضافه شد`,
      });
    } else {
      newItems = items.map(item =>
        item.id === editingItem.id ? { ...editingItem } : item
      );
      showToast(`${editingItem.name} ویرایش شد`, 'success');
      addEntry({
        userId: currentUser?.id || 0,
        userName: currentUser?.name || 'مدیر',
        userRole: currentUser?.role || 'manager',
        action: 'ویرایش آیتم منو',
        actionType: 'status',
        details: `آیتم "${editingItem.name}" ویرایش شد`,
      });
    }

    setItems(newItems);
    saveMenuToLocalStorage(newItems);
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleToggleAvailability = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newAvailable = !item.available;
    const newItems = items.map(i =>
      i.id === itemId ? { ...i, available: newAvailable } : i
    );
    setItems(newItems);
    saveMenuToLocalStorage(newItems);

    if (newAvailable) {
      showToast(`${item.name} موجود شد`, 'success');
    } else {
      showToast(`${item.name} ناموجود شد`, 'info');
    }

    addEntry({
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'مدیر',
      userRole: currentUser?.role || 'manager',
      action: newAvailable ? 'فعال‌سازی آیتم' : 'غیرفعال‌سازی آیتم',
      actionType: 'status',
      details: `آیتم "${item.name}" ${newAvailable ? 'فعال' : 'غیرفعال'} شد`,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (!confirm(`آیا از حذف "${item.name}" مطمئن هستید؟`)) return;

    const newItems = items.filter(i => i.id !== itemId);
    setItems(newItems);
    saveMenuToLocalStorage(newItems);
    showToast(`${item.name} حذف شد`, 'info');

    addEntry({
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'مدیر',
      userRole: currentUser?.role || 'manager',
      action: 'حذف آیتم منو',
      actionType: 'delete',
      details: `آیتم "${item.name}" حذف شد`,
    });
  };

  const saveMenuToLocalStorage = (newItems: MenuItemData[]) => {
    if (!menuData) return;
    const newMenuData: MenuData = {
      ...menuData,
      items: newItems,
      menu: {
        ...menuData.menu,
        lastUpdated: new Date().toISOString(),
      },
    };
    localStorage.setItem('menu-management', JSON.stringify(newMenuData));
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coffee': return '☕';
      case 'cold': return '🧊';
      case 'dessert': return '🍰';
      case 'food': return '🍔';
      default: return '🍽️';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'coffee': return 'قهوه';
      case 'cold': return 'نوشیدنی سرد';
      case 'dessert': return 'دسر';
      case 'food': return 'غذا';
      default: return category;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-dark)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h2 className="text-xl font-bold text-white">مدیریت منو</h2>
              <p className="text-sm text-[var(--text-secondary)]">{currentUser?.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingItem({ ...emptyForm, id: `item-${Date.now()}` });
              setIsAddingNew(true);
            }}
            className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded-xl hover:bg-[var(--accent)]/80 transition-colors"
          >
            + افزودن آیتم
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="جستجو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white placeholder-[var(--text-muted)]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white"
          >
            <option value="all">همه دسته‌ها</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-[var(--bg-panel)] rounded-2xl border overflow-hidden ${
                item.available
                  ? 'border-[var(--border-color)]'
                  : 'border-red-500/50 opacity-60'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{item.nameEn}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    item.available
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.available ? 'موجود' : 'ناموجود'}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[var(--accent)]">
                    {formatPrice(item.price)} تومان
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        item.available
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {item.available ? 'ناموجود' : 'موجود'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem({ ...item });
                        setIsAddingNew(false);
                      }}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
            <span className="text-6xl mb-4">🍽️</span>
            <p>آیتمی یافت نشد</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] rounded-2xl w-full max-w-md border border-[var(--border-color)]">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-white">
                {isAddingNew ? 'افزودن آیتم جدید' : 'ویرایش آیتم'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">نام (فارسی)</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white"
                  placeholder="نام آیتم"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">نام (انگلیسی)</label>
                <input
                  type="text"
                  value={editingItem.nameEn}
                  onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">دسته‌بندی</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as typeof CATEGORIES[number] })}
                  className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">توضیحات</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white resize-none h-20"
                  placeholder="توضیحات آیتم..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border-color)] flex gap-3">
              <button
                onClick={handleSaveItem}
                className="flex-1 py-2 bg-[var(--accent)] text-black font-bold rounded-xl hover:bg-[var(--accent)]/80 transition-colors"
              >
                ذخیره
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="flex-1 py-2 bg-gray-500/20 text-gray-300 rounded-xl hover:bg-gray-500/30 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
