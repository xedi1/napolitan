/**
 * Utility Functions
 * Common helper functions for the application
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Iranian Tomans
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

/**
 * Format price in English format
 */
export function formatPriceEn(price: number): string {
  return new Intl.NumberFormat('en-US').format(price) + ' T';
}

/**
 * Format time in Persian
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date in Persian
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time in Persian
 */
export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} - ${formatTime(timestamp)}`;
}

/**
 * Format relative time (e.g., "2 دقیقه پیش")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} روز پیش`;
  if (hours > 0) return `${hours} ساعت پیش`;
  if (minutes > 0) return `${minutes} دقیقه پیش`;
  return 'الان';
}

/**
 * Generate unique ID
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  items: { price: number; quantity: number }[],
  discountPercent?: number,
  taxPercent?: number
): {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountPercent ? Math.round(subtotal * (discountPercent / 100)) : 0;
  const afterDiscount = subtotal - discount;
  const tax = taxPercent ? Math.round(afterDiscount * (taxPercent / 100)) : 0;
  const total = afterDiscount + tax;
  
  return { subtotal, discount, tax, total };
}

/**
 * Validate phone number (Iranian)
 */
export function isValidIranianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+98|0)?9\d{9}$/.test(cleaned);
}

/**
 * Sanitize string for display
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-500',
    occupied: 'bg-red-500',
    preparing: 'bg-orange-500',
    awaiting: 'bg-yellow-500',
    eating: 'bg-blue-500',
    reserved: 'bg-purple-500',
    cleaning: 'bg-cyan-500',
    pending: 'bg-yellow-500',
    ready: 'bg-green-500',
    delivered: 'bg-blue-500',
    paid: 'bg-emerald-500',
    cancelled: 'bg-gray-500',
  };
  
  return colors[status] || 'bg-gray-500';
}

/**
 * Get status label in Persian
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'آزاد',
    occupied: 'اشغال',
    preparing: 'در حال آماده‌سازی',
    awaiting: 'منتظر',
    eating: 'در حال سرو',
    reserved: 'رزرو',
    cleaning: 'در حال تمیز کردن',
    pending: 'جدید',
    ready: 'آماده',
    delivered: 'تحویل داده شد',
    paid: 'پرداخت شد',
    cancelled: 'لغو شد',
  };
  
  return labels[status] || status;
}
