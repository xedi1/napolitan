'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore, ROLE_PERMISSIONS } from '@/store';
import { toast } from 'sonner';

const roleLabels = {
  manager: 'مدیریت',
  kitchen: 'آشپزخانه',
  waiter: 'گارسون',
};

const roleColors = {
  manager: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  kitchen: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  waiter: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export function Header() {
  const { currentUser, logout } = useAuthStore();
  const { toggleAuditPanel, toggleKitchenView, isKitchenView } = useUIStore();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('napoli-access-token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('[Logout] Error:', error);
    } finally {
      localStorage.removeItem('napoli-access-token');
      localStorage.removeItem('napoli-refresh-token');
      logout();
      toast.success('خروج موفق');
    }
  };

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 flex items-center justify-between">
      {/* Left: Logo & Kitchen Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center">
            <span className="text-xl">☕</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Napolitan
            </h1>
          </div>
        </div>

        {/* Kitchen View Toggle */}
        <button
          onClick={toggleKitchenView}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            isKitchenView
              ? 'bg-orange-500 text-white'
              : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          {isKitchenView ? '👨‍🍳 نمای آشپزخانه' : '🔄 تغییر به آشپزخانه'}
        </button>
      </div>

      {/* Center: Quick Stats */}
      <div className="hidden md:flex items-center gap-6">
        <QuickStat icon="🪑" label="میزها" value="6" />
        <QuickStat icon="📋" label="سفارشات" value="12" />
        <QuickStat icon="💰" label="درآمد امروز" value="2,450,000" suffix="تومان" />
      </div>

      {/* Right: User Info & Actions */}
      <div className="flex items-center gap-4">
        {/* Audit Log Button */}
        <button
          onClick={toggleAuditPanel}
          className="p-2 rounded-xl bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-elevated)] transition-all"
          title="لاگ تغییرات"
        >
          📋
        </button>

        {/* User Info */}
        {currentUser && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${roleColors[currentUser.role]}`}>
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs opacity-75">({roleLabels[currentUser.role]})</span>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
          title="خروج"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        {/* Clock */}
        <div className="text-right hidden lg:block">
          <div className="text-xl font-bold text-white">{time}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">{date}</div>
        </div>
      </div>
    </header>
  );
}

function QuickStat({ icon, label, value, suffix }: { icon: string; label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-light)] rounded-lg">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
        <div className="text-sm font-bold text-white">
          {value}
          {suffix && <span className="text-[var(--color-text-muted)] text-xs mr-1">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}
