// Data loader for seed data
// Loads tables.json and menu.json from public/data/

export interface TableData {
  id: string;
  shape: 'circle' | 'rectangle';
  dimensions: {
    diameter?: number;
    width?: number;
    depth?: number;
    height: number;
    topThickness: number;
  };
  position: { x: number; z: number };
  rotation: number;
  seats: number;
  group: string;
  status: 'available' | 'occupied' | 'preparing' | 'awaiting' | 'reserved' | 'cleaning';
  description: string;
}

export interface MenuItemData {
  id: string;
  name: string;
  nameEn: string;
  category: 'coffee' | 'cold' | 'dessert' | 'food';
  price: number;
  description: string;
  image: string;
  available: boolean;
}

export interface MenuData {
  menu: { name: string; currency: string; lastUpdated: string };
  categories: { id: string; name: string; icon: string }[];
  items: MenuItemData[];
}

export async function fetchTablesData(): Promise<TableData[]> {
  try {
    const response = await fetch('/data/tables.json');
    const data = await response.json();
    return data.tables;
  } catch (error) {
    console.error('Failed to load tables data:', error);
    return [];
  }
}

export async function fetchMenuData(): Promise<MenuData | null> {
  try {
    const response = await fetch('/data/menu.json');
    const data: MenuData = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load menu data:', error);
    return null;
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'خالی',
    occupied: 'اشغال',
    preparing: 'آماده‌سازی',
    awaiting: 'در انتظار',
    eating: 'در حال صرف',
    reserved: 'رزرو',
    cleaning: 'تمیزکاری',
  };
  return labels[status] || status;
}
