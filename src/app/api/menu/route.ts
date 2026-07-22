/**
 * GET /api/menu
 * Get all menu items and categories
 */

import { NextRequest, NextResponse } from 'next/server';

// Default menu items (same as store for consistency)
const DEFAULT_MENU_ITEMS = [
  // Hot Coffee
  { id: 'espresso', name: 'اسپرسو', nameEn: 'Espresso', category: 'hot_coffee', price: 55000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'americano', name: 'آمریکانو', nameEn: 'Americano', category: 'hot_coffee', price: 65000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'latte', name: 'لاته', nameEn: 'Latte', category: 'hot_coffee', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cappuccino', name: 'کاپوچینو', nameEn: 'Cappuccino', category: 'hot_coffee', price: 75000, available: true, sortOrder: 4, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'mocha', name: 'موکا', nameEn: 'Mocha', category: 'hot_coffee', price: 85000, available: true, sortOrder: 5, createdAt: Date.now(), updatedAt: Date.now() },
  // Cold Coffee
  { id: 'iced-latte', name: 'لاته سرد', nameEn: 'Iced Latte', category: 'cold_coffee', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'iced-americano', name: 'آمریکانو سرد', nameEn: 'Iced Americano', category: 'cold_coffee', price: 75000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cold-brew', name: 'کلد برو', nameEn: 'Cold Brew', category: 'cold_coffee', price: 95000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Hot Bar
  { id: 'hot-chocolate', name: 'شکلات داغ', nameEn: 'Hot Chocolate', category: 'hot_bar', price: 75000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'matcha-latte', name: 'ماتچا لاته', nameEn: 'Matcha Latte', category: 'hot_bar', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'chai-latte', name: 'چای لاته', nameEn: 'Chai Latte', category: 'hot_bar', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Tea
  { id: 'black-tea', name: 'چای سیاه', nameEn: 'Black Tea', category: 'tea', price: 35000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'green-tea', name: 'چای سبز', nameEn: 'Green Tea', category: 'tea', price: 40000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'herbal-tea', name: 'دمنوش', nameEn: 'Herbal Tea', category: 'tea', price: 45000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Frappe
  { id: 'mocha-frappe', name: 'موکا فراپه', nameEn: 'Mocha Frappe', category: 'frappe', price: 95000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'caramel-frappe', name: 'کارامل فراپه', nameEn: 'Caramel Frappe', category: 'frappe', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vanilla-frappe', name: 'وانیل فراپه', nameEn: 'Vanilla Frappe', category: 'frappe', price: 90000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Shake Bar
  { id: 'chocolate-shake', name: 'شیک شکلات', nameEn: 'Chocolate Shake', category: 'shake_bar', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vanilla-shake', name: 'شیک وانیل', nameEn: 'Vanilla Shake', category: 'shake_bar', price: 80000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'strawberry-shake', name: 'شیک توت فرنگی', nameEn: 'Strawberry Shake', category: 'shake_bar', price: 90000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Mojito
  { id: 'classic-mojito', name: 'موهیتو کلاسیک', nameEn: 'Classic Mojito', category: 'mojito', price: 85000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'berry-mojito', name: 'موهیتو توت', nameEn: 'Berry Mojito', category: 'mojito', price: 95000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  // Baked Potato
  { id: 'baked-potato-cheese', name: 'سیب زمینی پنیری', nameEn: 'Cheese Baked Potato', category: 'baked_potato', price: 125000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'baked-potato-bacon', name: 'سیب زمینی بیکن', nameEn: 'Bacon Baked Potato', category: 'baked_potato', price: 145000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  // Italian Plate
  { id: 'pasta-carbonara', name: 'پاستا کاربونارا', nameEn: 'Pasta Carbonara', category: 'italian_plate', price: 185000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'pasta-bolognese', name: 'پاستا بولونز', nameEn: 'Pasta Bolognese', category: 'italian_plate', price: 175000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'risotto', name: 'ریزوتو', nameEn: 'Risotto', category: 'italian_plate', price: 195000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Burger
  { id: 'classic-burger', name: 'برگر کلاسیک', nameEn: 'Classic Burger', category: 'burger', price: 165000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'cheese-burger', name: 'چیزبرگر', nameEn: 'Cheese Burger', category: 'burger', price: 185000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'double-burger', name: 'دبل برگر', nameEn: 'Double Burger', category: 'burger', price: 225000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Pizza
  { id: 'margherita', name: 'پیتزا مارگاریتا', nameEn: 'Margherita Pizza', category: 'pizza', price: 175000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'pepperoni', name: 'پیتزا پپرونی', nameEn: 'Pepperoni Pizza', category: 'pizza', price: 195000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'vegetarian', name: 'پیتزا سبزیجات', nameEn: 'Vegetarian Pizza', category: 'pizza', price: 165000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
  // Cake & Dessert
  { id: 'cheesecake', name: 'چیزکیک', nameEn: 'Cheesecake', category: 'cake_dessert', price: 95000, available: true, sortOrder: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'tiramisu', name: 'تیرامیسو', nameEn: 'Tiramisu', category: 'cake_dessert', price: 105000, available: true, sortOrder: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'brownie', name: 'براونی', nameEn: 'Brownie', category: 'cake_dessert', price: 75000, available: true, sortOrder: 3, createdAt: Date.now(), updatedAt: Date.now() },
];

const DEFAULT_CATEGORIES = [
  'hot_coffee', 'cold_coffee', 'hot_bar', 'tea', 'frappe', 'shake_bar', 'mojito',
  'baked_potato', 'italian_plate', 'burger', 'pizza', 'cake_dessert'
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      items: DEFAULT_MENU_ITEMS,
      categories: DEFAULT_CATEGORIES,
    });
  } catch (error) {
    console.error('[Menu] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
