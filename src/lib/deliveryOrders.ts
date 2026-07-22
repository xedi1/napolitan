'use client';

import { useState, useEffect, useCallback } from 'react';

export type DeliveryPlatform = 'snapfood' | 'tapsifood' | 'tourbon';

export interface DeliveryOrder {
  id: string;
  externalId: string;
  platform: DeliveryPlatform;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  createdAt: number;
  customerName?: string;
  customerPhone?: string;
  address: string;
  paymentMethod: 'online' | 'cash';
  notes?: string;
}

interface UseDeliveryOrdersReturn {
  orders: DeliveryOrder[];
  isLoading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: DeliveryOrder['status']) => Promise<void>;
  pendingCount: number;
  todayRevenue: number;
  addDemoOrder: () => void;
}

// Demo orders for testing
const DEMO_ORDERS: DeliveryOrder[] = [
  {
    id: 'demo-1',
    externalId: 'SNAP-2024-001',
    platform: 'snapfood',
    items: [
      { id: '1', menuItemId: 'm1', name: 'اسپرسو', quantity: 2, price: 45000 },
      { id: '2', menuItemId: 'm2', name: 'کاپوچینو', quantity: 1, price: 65000 },
      { id: '3', menuItemId: 'm3', name: 'کیک شکلاتی', quantity: 1, price: 85000 },
    ],
    status: 'pending',
    subtotal: 195000,
    total: 195000,
    createdAt: Date.now() - 300000, // 5 min ago
    customerName: 'علی محمدی',
    customerPhone: '09123456789',
    address: 'تهران، خیابان ولیعصر، پلاک 123',
    paymentMethod: 'online',
    notes: 'لطفاً بدون قاشق بفرستید',
  },
  {
    id: 'demo-2',
    externalId: 'TAPSI-2024-042',
    platform: 'tapsifood',
    items: [
      { id: '4', menuItemId: 'm4', name: 'لاته', quantity: 2, price: 55000 },
      { id: '5', menuItemId: 'm5', name: 'موکا', quantity: 1, price: 60000 },
    ],
    status: 'preparing',
    subtotal: 170000,
    total: 170000,
    createdAt: Date.now() - 600000, // 10 min ago
    customerName: 'مریم احمدی',
    customerPhone: '09351234567',
    address: 'تهران، خیابان انقلاب، کوچه ۵',
    paymentMethod: 'cash',
  },
  {
    id: 'demo-3',
    externalId: 'TOUR-2024-018',
    platform: 'tourbon',
    items: [
      { id: '6', menuItemId: 'm6', name: 'چای ماسالا', quantity: 2, price: 40000 },
      { id: '7', menuItemId: 'm7', name: 'نان کره‌ای', quantity: 2, price: 25000 },
    ],
    status: 'ready',
    subtotal: 130000,
    total: 130000,
    createdAt: Date.now() - 900000, // 15 min ago
    customerName: 'رضا کریمی',
    customerPhone: '09198765432',
    address: 'تهران، یوسف‌آباد، خیابان ۱۵',
    paymentMethod: 'online',
  },
];

export function useDeliveryOrders(): UseDeliveryOrdersReturn {
  const [orders, setOrders] = useState<DeliveryOrder[]>(DEMO_ORDERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    // In production, this would fetch from API
    // For demo, we use local state
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: DeliveryOrder['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  }, []);

  const addDemoOrder = useCallback(() => {
    const platforms: DeliveryPlatform[] = ['snapfood', 'tapsifood', 'tourbon'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const names = ['سارا وکیلی', 'محمد رضایی', 'زهرا محمدی', 'امیر احمدی'];
    const items = [
      [{ name: 'اسپرسو', price: 45000, quantity: 1 }],
      [{ name: 'کاپوچینو', price: 65000, quantity: 2 }],
      [{ name: 'لاته', price: 55000, quantity: 1 }],
      [{ name: 'چای', price: 35000, quantity: 2 }],
    ];

    const newOrder: DeliveryOrder = {
      id: `demo-${Date.now()}`,
      externalId: `${platform.toUpperCase()}-${Date.now()}`,
      platform,
      items: items[Math.floor(Math.random() * items.length)].map((item, i) => ({
        id: `item-${i}`,
        menuItemId: `m${i}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      status: 'pending',
      subtotal: items[0].reduce((sum, i) => sum + i.price * i.quantity, 0),
      total: items[0].reduce((sum, i) => sum + i.price * i.quantity, 0),
      createdAt: Date.now(),
      customerName: names[Math.floor(Math.random() * names.length)],
      customerPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`,
      address: 'تهران، خیابان ولیعصر',
      paymentMethod: Math.random() > 0.5 ? 'online' : 'cash',
    };

    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  
  const todayRevenue = orders
    .filter(o => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return o.createdAt >= today.getTime() && o.status !== 'cancelled';
    })
    .reduce((sum, o) => sum + o.total, 0);

  return {
    orders,
    isLoading,
    error,
    refreshOrders: fetchOrders,
    updateOrderStatus,
    pendingCount,
    todayRevenue,
    addDemoOrder,
  };
}

// Platform labels
export const PLATFORM_LABELS: Record<DeliveryPlatform, { name: string; icon: string }> = {
  snapfood: { name: 'اسنپ‌فود', icon: '🥡' },
  tapsifood: { name: 'تپسی‌فود', icon: '🚗' },
  tourbon: { name: 'توربون', icon: '🍽️' },
};

// Status labels
export const STATUS_LABELS: Record<DeliveryOrder['status'], string> = {
  pending: 'در انتظار',
  preparing: 'در حال آماده‌سازی',
  ready: 'آماده',
  delivered: 'تحویل داده شد',
  cancelled: 'لغو شده',
};

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}
