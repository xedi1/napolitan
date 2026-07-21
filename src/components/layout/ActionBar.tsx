'use client';

import { useUIStore, useAuthStore, ROLE_PERMISSIONS } from '@/store';

export function ActionBar() {
  const { 
    toggleTakeaway, 
    toggleMenuManagement, 
    toggleUserManagement,
    isTakeawayOpen,
    selectedFloor,
    setSelectedFloor 
  } = useUIStore();
  const { currentUser } = useAuthStore();

  const canManageMenu = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canManageMenu;
  const canManageUsers = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canManageUsers;

  return (
    <div className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 flex items-center justify-between">
      {/* Left: Floor Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-secondary)]">طبقه:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedFloor(1)}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              selectedFloor === 1
                ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            طبقه ۱
          </button>
          <button
            onClick={() => setSelectedFloor(2)}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              selectedFloor === 2
                ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            طبقه ۲
          </button>
        </div>
      </div>

      {/* Center: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Takeaway Button */}
        <button
          onClick={toggleTakeaway}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isTakeawayOpen
              ? 'bg-orange-500 text-white'
              : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30 border border-orange-500/30'
          }`}
        >
          <span className="text-lg">🚗</span>
          <span>سفارش بیرون‌بر</span>
        </button>

        {/* Menu Management */}
        {canManageMenu && (
          <button
            onClick={toggleMenuManagement}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white rounded-xl transition-all"
          >
            <span>📋</span>
            <span>مدیریت منو</span>
          </button>
        )}

        {/* User Management */}
        {canManageUsers && (
          <button
            onClick={toggleUserManagement}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white rounded-xl transition-all"
          >
            <span>👥</span>
            <span>مدیریت کاربران</span>
          </button>
        )}
      </div>

      {/* Right: View Mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">حالت نمایش:</span>
        <div className="flex gap-1">
          <button className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-lg text-sm font-medium">
            🏠 سه‌بعدی
          </button>
          <button className="px-3 py-1.5 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:text-white transition-all">
            📊 لیست
          </button>
        </div>
      </div>
    </div>
  );
}
