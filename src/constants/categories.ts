import type { MenuCategory } from '@/types';

export const MENU_CATEGORIES: { id: MenuCategory; name: string; icon: string }[] = [
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

export const getCategoryIcon = (category: MenuCategory): string => {
  return MENU_CATEGORIES.find((c) => c.id === category)?.icon || '🍽️';
};
