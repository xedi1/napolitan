'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

const MENU_ITEMS = [
  { id: '1', name: 'Espresso', nameFa: 'اسپرسو', category: 'coffee', price: 35000 },
  { id: '2', name: 'Cappuccino', nameFa: 'کاپوچینو', category: 'coffee', price: 55000 },
  { id: '3', name: 'Latte', nameFa: 'لاته', category: 'coffee', price: 60000 },
  { id: '4', name: 'Mocha', nameFa: 'موکا', category: 'coffee', price: 65000 },
  { id: '5', name: 'Tea', nameFa: 'چای', category: 'tea', price: 20000 },
  { id: '6', name: 'Green Tea', nameFa: 'چای سبز', category: 'tea', price: 25000 },
  { id: '7', name: 'Cheesecake', nameFa: 'چیزکیک', category: 'dessert', price: 85000 },
  { id: '8', name: 'Tiramisu', nameFa: 'تیرامیسو', category: 'dessert', price: 95000 },
];

export function MenuModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl max-h-[80vh] bg-[var(--bg-panel)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 id="menuModalTitle" className="text-xl font-bold">منوی کافه</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-[var(--bg-dark)] rounded-lg">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {MENU_ITEMS.map(item => (
              <div key={item.id} className="p-4 bg-[var(--bg-dark)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors cursor-pointer">
                <h3 className="font-bold">{item.nameFa}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.name}</p>
                <p className="text-[var(--accent)] font-medium mt-2">{formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
