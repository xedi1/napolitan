'use client';

import { useAuthStore, useUIStore, ROLE_PERMISSIONS } from '@/store';
import { useEffect, useState } from 'react';

export function Header() {
  const { currentUser, logout } = useAuthStore();
  const { isTextMode, toggleTextMode, toggleAuditPanel } = useUIStore();
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

  const canViewAudit = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canViewAuditLog;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-panel)]/80 backdrop-blur-xl border-b border-[var(--border-color)] z-40 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">☕</span>
        <div>
          <h1 className="text-lg font-bold text-white">Cafe Napoli</h1>
          <span className="text-xs text-[var(--text-secondary)]">سیستم مدیریت سالن</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* User Badge */}
        {currentUser && (
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/15 rounded-xl hover:bg-[var(--accent)]/25 transition-colors"
            title="کلیک برای خروج"
          >
            <span>{currentUser.name}</span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
              currentUser.role === 'manager' ? 'bg-yellow-400 text-black' :
              currentUser.role === 'supervisor' ? 'bg-[var(--accent)] text-black' :
              'bg-green-400 text-black'
            }`}>
              {currentUser.role === 'manager' ? 'مدیر' :
               currentUser.role === 'supervisor' ? 'سرپرست' : 'گارسون'}
            </span>
          </button>
        )}

        {/* Text Mode Toggle */}
        <button
          onClick={toggleTextMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            isTextMode ? 'bg-[var(--accent)] text-black' : 'bg-[var(--bg-dark)] hover:bg-[var(--accent)]/20'
          }`}
          title="Alt+T"
          aria-label="تغییر حالت نمایش"
        >
          <span>📄</span>
          <span className="text-sm">متنی</span>
        </button>

        {/* Audit Log Button */}
        {canViewAudit && (
          <button
            onClick={toggleAuditPanel}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-dark)] rounded-xl hover:bg-[var(--accent)]/20 transition-colors"
            aria-label="لاگ تغییرات"
          >
            <span>📋</span>
            <span className="text-sm">لاگ</span>
          </button>
        )}

        {/* Clock */}
        <div className="text-right">
          <div className="text-xl font-bold text-white">{time}</div>
          <div className="text-xs text-[var(--text-secondary)]">{date}</div>
        </div>
      </div>
    </header>
  );
}
