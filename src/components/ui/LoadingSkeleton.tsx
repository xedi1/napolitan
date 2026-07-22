'use client';

/**
 * Loading Skeleton Components
 * Provides visual feedback during data loading
 * Replaces white screens of death with graceful loading states
 */

import { memo } from 'react';

// ============================================
// Base Skeleton
// ============================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = memo(function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-[var(--color-surface-light)]';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
});

// ============================================
// Table Skeleton
// ============================================
export function TableSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton
            variant="circular"
            width={70}
            height={70}
            className="bg-[var(--color-surface-light)]"
          />
          <Skeleton width={40} height={20} />
          <Skeleton width={60} height={16} className="opacity-50" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Menu Item Skeleton
// ============================================
export function MenuItemSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel p-4 space-y-3">
          <Skeleton height={120} className="w-full" />
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} className="opacity-70" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton width={60} height={24} />
            <Skeleton width={70} height={32} className="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Order Panel Skeleton
// ============================================
export function OrderPanelSkeleton() {
  return (
    <div className="fixed bottom-20 right-6 w-80 panel p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton width={100} height={24} />
        <Skeleton width={30} height={30} variant="circular" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton width={40} height={40} variant="rectangular" />
            <div className="flex-1 space-y-2">
              <Skeleton width="80%" height={16} />
              <Skeleton width="40%" height={12} className="opacity-60" />
            </div>
            <Skeleton width={30} height={24} />
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton width={60} height={16} />
          <Skeleton width={50} height={16} />
        </div>
        <Skeleton width="100%" height={44} className="rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// Kitchen View Skeleton
// ============================================
export function KitchenViewSkeleton() {
  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton width={150} height={32} />
        <div className="flex gap-4">
          <Skeleton width={80} height={32} className="rounded-xl" />
          <Skeleton width={80} height={32} className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton width={80} height={20} />
              <Skeleton width={60} height={20} className="rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} width="90%" height={16} className="opacity-80" />
              ))}
            </div>
            <Skeleton width={100} height={32} className="rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Full Page Loading
// ============================================
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'در حال بارگذاری...' }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-[var(--color-accent)]/30 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-lg text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// Error State
// ============================================
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'خطا رخ داده',
  message = 'متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-5xl">⚠️</div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-[var(--color-text-secondary)]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-medium rounded-xl transition-colors"
          >
            🔄 تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="text-5xl">{icon}</div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--color-text-muted)] max-w-xs">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-medium rounded-xl transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
