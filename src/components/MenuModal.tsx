'use client';

import { useState, useEffect } from 'react';
import { fetchMenuData, formatPrice, type MenuData, type MenuItemData } from '@/lib/data';
import { LazyImage, preloadImages } from './LazyImage';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem?: (item: MenuItemData) => void;
}

export function MenuModal({ isOpen, onClose, onAddItem }: MenuModalProps) {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !menuData) {
      fetchMenuData().then(data => {
        if (data) {
          setMenuData(data);
          // Preload images in background
          const imageUrls = data.items
            .filter(item => item.image)
            .map(item => item.image);
          preloadImages(imageUrls.slice(0, 5)); // Preload first 5
        }
      });
    }
  }, [isOpen, menuData]);

  const filteredItems = selectedCategory
    ? menuData?.items.filter(item => item.category === selectedCategory) || []
    : menuData?.items || [];

  const handleAddItem = (item: MenuItemData) => {
    if (!item.available) return;
    onAddItem?.(item);
    
    // Show feedback animation
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-panel)] rounded-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
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
              <div 
                key={item.id} 
                className={`p-4 bg-[var(--bg-dark)] rounded-xl transition-all cursor-pointer relative ${
                  !item.available 
                    ? 'opacity-50 cursor-not-allowed' 
                    : addedItemId === item.id 
                      ? 'bg-green-500/20 ring-2 ring-green-500' 
                      : 'hover:bg-[var(--accent)]/10 hover:scale-[1.02]'
                }`}
                onClick={() => handleAddItem(item)}
              >
                {item.image && (
                  <LazyImage 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-24 rounded-lg mb-2" 
                  />
                )}
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{item.nameEn}</p>
                <p className="text-[var(--accent)] font-medium mt-2">{formatPrice(item.price, menuData?.menu.currency)}</p>
                
                {/* Add Button */}
                <button
                  className={`absolute bottom-2 left-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    !item.available
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : addedItemId === item.id
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--accent)] text-black hover:bg-[var(--accent)]/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddItem(item);
                  }}
                  disabled={!item.available}
                >
                  {addedItemId === item.id ? '✓' : '+'}
                </button>
                
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
