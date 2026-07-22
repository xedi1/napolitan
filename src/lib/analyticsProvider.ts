'use client';

import { useMemo } from 'react';
import { useOrderStore } from '@/store';
import { Order, OrderItem } from '@/types';

/**
 * Analytics Provider
 * Provides sales analytics, peak hours, and performance metrics
 * Uses Persian (Solar Hijri) calendar for date calculations
 */

// ============================================
// Persian Calendar Utilities
// ============================================

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

/**
 * Convert Gregorian date to Persian
 */
export function gregorianToPersian(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const persianEpoch = { year: 621, month: 3, day: 21 };
  
  // Days since March 21, 621
  const gDays = Math.floor((year - 1) * 365.25 + (month - 1) * 30.4375 + day);
  const pYear = persianEpoch.year + Math.floor((gDays - 80) / 365.2425);
  
  // Calculate day of year
  const marchDay = getPersianNewYearDay(pYear);
  const dayOfYear = gDays - (getPersianNewYearDay(pYear - 1) - 80);
  
  let pMonth: number, pDay: number;
  if (dayOfYear <= 186) {
    pMonth = Math.floor((dayOfYear - 1) / 31);
    pDay = dayOfYear - pMonth * 31;
  } else {
    pMonth = Math.floor((dayOfYear - 187) / 30) + 6;
    pDay = dayOfYear - 186 - (pMonth - 6) * 30;
  }
  
  return { year: pYear, month: pMonth + 1, day: pDay };
}

function getPersianNewYearDay(year: number): number {
  return Math.floor((year - 474) * 365.2425) + 186;
}

/**
 * Format Persian date
 */
export function formatPersianDate(timestamp: number): string {
  const date = new Date(timestamp);
  const persian = gregorianToPersian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${PERSIAN_DAYS[date.getDay()]}، ${persian.day} ${PERSIAN_MONTHS[persian.month - 1]} ${persian.year}`;
}

/**
 * Format Persian month/year
 */
export function formatPersianMonth(month: number, year: number): string {
  return `${PERSIAN_MONTHS[month - 1]} ${year}`;
}

/**
 * Get Persian month start/end timestamps
 */
export function getPersianMonthRange(month: number, year: number): { start: number; end: number } {
  // Calculate Gregorian equivalent
  const isLeapYear = (year - 474) % 33 % 4 === 1;
  const monthDays = month <= 6 ? 31 : month <= 11 ? 30 : isLeapYear ? 30 : 29;
  
  // Approximate calculation (for exact, use a proper library)
  const baseYear = year - 621;
  const baseMonth = month - 3;
  const startDate = new Date(baseYear, baseMonth < 0 ? baseMonth + 12 : baseMonth, 
    month === 1 ? 1 : 21);
  const endDate = new Date(baseYear, baseMonth < 0 ? baseMonth + 12 : baseMonth + 1,
    month === 1 ? 20 : 20);
  
  return { start: startDate.getTime(), end: endDate.getTime() };
}

/**
 * Get week start/end (Saturday to Friday in Iran)
 */
export function getPersianWeekRange(date: Date = new Date()): { start: number; end: number } {
  const day = date.getDay();
  const saturdayIndex = day === 6 ? 0 : day + 1;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - saturdayIndex);
  saturday.setHours(0, 0, 0, 0);
  
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  friday.setHours(23, 59, 59, 999);
  
  return { start: saturday.getTime(), end: friday.getTime() };
}

/**
 * Get day start/end timestamps
 */
export function getDayRange(timestamp: number): { start: number; end: number } {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  const start = date.getTime();
  
  date.setHours(23, 59, 59, 999);
  const end = date.getTime();
  
  return { start, end };
}

// ============================================
// Analytics Types
// ============================================

export interface SalesMetric {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
}

export interface TopSellingItem {
  itemId: string;
  name: string;
  nameEn?: string;
  quantity: number;
  revenue: number;
  orderCount: number;
}

export interface HourlyMetric {
  hour: number;
  orderCount: number;
  revenue: number;
}

export interface TableMetric {
  tableId: number;
  orderCount: number;
  totalRevenue: number;
  averageServingTime: number; // in minutes
}

export interface DailyMetric {
  date: string;
  persianDate: string;
  orderCount: number;
  revenue: number;
}

export interface CategoryMetric {
  category: string;
  label: string;
  orderCount: number;
  revenue: number;
  percentage: number;
}

// ============================================
// Analytics Hooks
// ============================================

export function useSalesAnalytics(timeRange: 'today' | 'week' | 'month' | 'all' = 'today') {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
      case 'today':
        startTime = getDayRange(now).start;
        break;
      case 'week':
        startTime = getPersianWeekRange().start;
        break;
      case 'month':
        const persian = gregorianToPersian(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        startTime = getPersianMonthRange(persian.month, persian.year).start;
        break;
      case 'all':
        startTime = 0;
        break;
    }
    
    const filteredOrders = orders.filter(o => 
      o.status === 'paid' && 
      o.paidAt && 
      o.paidAt >= startTime
    );
    
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = filteredOrders.reduce((sum, o) => 
      sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
    );
    
    return {
      totalSales,
      totalOrders: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0,
      totalItems,
    } as SalesMetric;
  }, [orders, timeRange]);
}

export function useTopSellingItems(timeRange: 'today' | 'week' | 'month' | 'all' = 'week', limit = 10) {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
      case 'today':
        startTime = getDayRange(now).start;
        break;
      case 'week':
        startTime = getPersianWeekRange().start;
        break;
      case 'month':
        const persian = gregorianToPersian(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        startTime = getPersianMonthRange(persian.month, persian.year).start;
        break;
      case 'all':
        startTime = 0;
        break;
    }
    
    const itemMap = new Map<string, TopSellingItem>();
    
    orders
      .filter(o => o.status === 'paid' && o.paidAt && o.paidAt >= startTime)
      .forEach(order => {
        order.items.forEach(item => {
          const existing = itemMap.get(item.menuItemId);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.price * item.quantity;
            existing.orderCount += 1;
          } else {
            itemMap.set(item.menuItemId, {
              itemId: item.menuItemId,
              name: item.name,
              nameEn: item.nameEn,
              quantity: item.quantity,
              revenue: item.price * item.quantity,
              orderCount: 1,
            });
          }
        });
      });
    
    return Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [orders, timeRange, limit]);
}

export function useHourlyAnalytics(date?: number) {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const targetDate = date || Date.now();
    const { start, end } = getDayRange(targetDate);
    
    const hourlyData: HourlyMetric[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orderCount: 0,
      revenue: 0,
    }));
    
    orders
      .filter(o => o.status === 'paid' && o.paidAt && o.paidAt >= start && o.paidAt <= end)
      .forEach(order => {
        const hour = new Date(order.paidAt!).getHours();
        hourlyData[hour].orderCount += 1;
        hourlyData[hour].revenue += order.total;
      });
    
    return hourlyData;
  }, [orders, date]);
}

export function useDailyAnalytics(days = 7) {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const result: DailyMetric[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { start, end } = getDayRange(date.getTime());
      
      const dayOrders = orders.filter(o => 
        o.status === 'paid' && o.paidAt && o.paidAt >= start && o.paidAt <= end
      );
      
      const persian = gregorianToPersian(date.getFullYear(), date.getMonth() + 1, date.getDate());
      
      result.push({
        date: date.toISOString().split('T')[0],
        persianDate: `${persian.day} ${PERSIAN_MONTHS[persian.month - 1]}`,
        orderCount: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }
    
    return result;
  }, [orders, days]);
}

export function useTableAnalytics() {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const tableMap = new Map<number, {
      orderCount: number;
      totalRevenue: number;
      totalServingTime: number;
      orderTimestamps: { created: number; paid: number }[];
    }>();
    
    orders
      .filter(o => o.status === 'paid' && o.tableId !== null)
      .forEach(order => {
        const tableId = order.tableId!;
        const existing = tableMap.get(tableId) || {
          orderCount: 0,
          totalRevenue: 0,
          totalServingTime: 0,
          orderTimestamps: [],
        };
        
        existing.orderCount += 1;
        existing.totalRevenue += order.total;
        
        if (order.paidAt && order.createdAt) {
          existing.totalServingTime += (order.paidAt - order.createdAt) / 60000; // minutes
        }
        
        existing.orderTimestamps.push({ created: order.createdAt, paid: order.paidAt || Date.now() });
        tableMap.set(tableId, existing);
      });
    
    return Array.from(tableMap.entries())
      .map(([tableId, data]) => ({
        tableId,
        orderCount: data.orderCount,
        totalRevenue: data.totalRevenue,
        averageServingTime: data.orderCount > 0 ? data.totalServingTime / data.orderCount : 0,
      } as TableMetric))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders]);
}

export function useCategoryAnalytics(timeRange: 'today' | 'week' | 'month' | 'all' = 'week') {
  const orders = useOrderStore((s) => s.orders);
  
  return useMemo(() => {
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
      case 'today':
        startTime = getDayRange(now).start;
        break;
      case 'week':
        startTime = getPersianWeekRange().start;
        break;
      case 'month':
        const persian = gregorianToPersian(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        startTime = getPersianMonthRange(persian.month, persian.year).start;
        break;
      case 'all':
        startTime = 0;
        break;
    }
    
    const categoryMap = new Map<string, { orderCount: number; revenue: number }>();
    let totalRevenue = 0;
    
    orders
      .filter(o => o.status === 'paid' && o.paidAt && o.paidAt >= startTime)
      .forEach(order => {
        order.items.forEach(item => {
          const existing = categoryMap.get(item.category) || { orderCount: 0, revenue: 0 };
          existing.orderCount += item.quantity;
          existing.revenue += item.price * item.quantity;
          categoryMap.set(item.category, existing);
          totalRevenue += item.price * item.quantity;
        });
      });
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        label: getCategoryLabel(category),
        orderCount: data.orderCount,
        revenue: data.revenue,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      } as CategoryMetric))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, timeRange]);
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    hot_coffee: 'قهوه گرم',
    cold_coffee: 'قهوه سرد',
    drip_coffee: 'قهوه دمی',
    hot_bar: 'بار گرم',
    tea: 'چای',
    frappe: 'گلاسه',
    shake_bar: 'شیک بار',
    mojito: 'ماکتیل',
    baked_potato: 'سیب‌زمینی تنوری',
    italian_plate: 'بشقاب ایتالیایی',
    burger: 'برگر',
    pizza: 'پیتزا',
    cake_dessert: 'کیک و دسر',
  };
  return labels[category] || category;
}

// ============================================
// Format Utilities
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} دقیقه`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}:${mins.toString().padStart(2, '0')} ساعت`;
}
