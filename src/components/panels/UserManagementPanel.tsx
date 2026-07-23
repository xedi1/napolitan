'use client';

import { useUIStore } from '@/store';

/**
 * UserManagementPanel - User management interface
 * 
 * Features to implement:
 * - View all users (manager only)
 * - Add new users
 * - Edit user roles
 * - Deactivate users
 * - Reset passwords
 * 
 * Note: Requires Supabase Auth setup for full functionality
 */
export function UserManagementPanel() {
  const { isUserManagementOpen, toggleUserManagement } = useUIStore();

  if (!isUserManagementOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={toggleUserManagement}>
      <div
        className="absolute inset-4 md:inset-8 lg:inset-y-8 lg:inset-x-32 bg-[var(--color-surface)] rounded-3xl overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-xl font-bold text-white">مدیریت کاربران</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                مدیریت حساب‌های کاربری و نقش‌ها
              </p>
            </div>
          </div>
          <button
            onClick={toggleUserManagement}
            className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content - Coming Soon */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔜</div>
            <h3 className="text-xl font-bold text-white mb-2">در حال توسعه</h3>
            <p className="text-[var(--color-text-secondary)] max-w-md">
              این قابلیت به زودی اضافه خواهد شد.
              <br />
              مدیریت کاربران نیاز به تنظیمات Supabase Auth دارد.
            </p>
            <div className="mt-6 p-4 bg-[var(--color-surface-light)] rounded-xl text-right max-w-md mx-auto">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">قابلیت‌های آینده:</p>
              <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                <li>• مشاهده لیست کاربران</li>
                <li>• افزودن کاربر جدید</li>
                <li>• ویرایش نقش کاربران</li>
                <li>• غیرفعال کردن حساب کاربری</li>
                <li>• بازنشانی رمز عبور</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-light)]/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">
              برای مدیریت کاربران با توسعه‌دهنده تماس بگیرید
            </span>
            <button
              onClick={toggleUserManagement}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold rounded-xl hover:bg-[var(--color-accent-light)] transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
