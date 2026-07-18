'use client';

import { useState, useEffect } from 'react';
import { fetchMenuData, formatPrice, type MenuData } from '@/lib/data';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuModal({ isOpen, onClose }: MenuModalProps) {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !menuData) {
      fetchMenuData().then(data => {
        if (data) setMenuData(data);
      });
    }
  }, [isOpen, menuData]);

  const filteredItems = selectedCategory
    ? menuData?.items.filter(item => item.category === selectedCategory) || []
    : menuData?.items || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-panel)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 id="menuModalTitle" className="text-xl font-bold">{menuData?.menu.name || 'منوی کافه'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-dark)] rounded-lg">✕</button>
        </div>
        
        {/* Category Filter */}
        {menuData && (
          <div className="p-3 border-b border-[var(--border-color)] flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${!selectedCategory ? 'bg-[var(--accent)] text-black' : 'bg-[var(--bg-dark)]'}`}
            >
              همه
            </button>
            {menuData.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedCategory === cat.id ? 'bg-[var(--accent)] text-black' : 'bg-[var(--bg-dark)]'}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="p-4 bg-[var(--bg-dark)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors cursor-pointer relative">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{item.nameEn}</p>
                <p className="text-[var(--accent)] font-medium mt-2">{formatPrice(item.price, menuData?.menu.currency)}</p>
                {!item.available && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs rounded">ناموجود</span>
                )}
              </div>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8">در حال بارگذاری...</p>
          )}
        </div>
      </div>
    </div>
  );
}
