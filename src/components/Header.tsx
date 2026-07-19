'use client';

import { useAuthStore, useUIStore, ROLE_PERMISSIONS } from '@/store';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  manager: 'مدیریت',
  kitchen: 'آشپزخانه',
  waiter: 'گارسون',
};

const roleColors: Record<UserRole, string> = {
  manager: 'bg-yellow-400 text-black',
  kitchen: 'bg-orange-400 text-black',
  waiter: 'bg-green-400 text-black',
};

export function Header() {
  const { currentUser, logout, selectedRole, selectRole } = useAuthStore();
  const { isTextMode, toggleTextMode, toggleAuditPanel } = useUIStore();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [customerSiteUrl, setCustomerSiteUrl] = useState('');

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
  const isManager = currentUser?.role === 'manager';
  const currentRoleLabel = selectedRole ? roleLabels[selectedRole as UserRole] : '';

  const handleRoleSwitch = (role: UserRole) => {
    selectRole(role);
    setShowRoleSwitcher(false);
  };

  const openCustomerSite = () => {
    if (customerSiteUrl) {
      window.open(customerSiteUrl, '_blank');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-panel)]/90 backdrop-blur-xl border-b border-[var(--border-color)] z-40">
      <div className="h-full flex items-center justify-between px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <img 
            src="/assets/logoNAp.png" 
            alt="Napolitan" 
            className="h-14 w-auto"
          />
          
          {/* Customer Site Link (Small) */}
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-[var(--border-color)]">
            <input
              type="url"
              placeholder="لینک سایت مشتری..."
              value={customerSiteUrl}
              onChange={(e) => setCustomerSiteUrl(e.target.value)}
              className="w-48 px-3 py-1.5 text-sm bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            {customerSiteUrl && (
              <button
                onClick={openCustomerSite}
                className="p-1.5 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black rounded-lg transition-colors"
                title="باز کردن سایت مشتری"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Role Switcher (Manager only) */}
          {isManager && (
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-dark)] rounded-xl hover:bg-[var(--accent)]/20 transition-colors border border-[var(--border-color)]"
              >
                <span>{selectedRole === 'manager' ? '👑' : selectedRole === 'kitchen' ? '👨‍🍳' : '🍽️'}</span>
                <span className="text-white font-medium">{currentRoleLabel}</span>
                <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showRoleSwitcher && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => handleRoleSwitch('manager')}
                    className={`w-full px-4 py-3 text-right hover:bg-[var(--bg-dark)] transition-colors flex items-center gap-3 ${selectedRole === 'manager' ? 'bg-[var(--accent)]/10' : ''}`}
                  >
                    <span>👑</span>
                    <span className={selectedRole === 'manager' ? 'text-[var(--accent)]' : 'text-white'}>مدیریت</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('kitchen')}
                    className={`w-full px-4 py-3 text-right hover:bg-[var(--bg-dark)] transition-colors flex items-center gap-3 ${selectedRole === 'kitchen' ? 'bg-[var(--accent)]/10' : ''}`}
                  >
                    <span>👨‍🍳</span>
                    <span className={selectedRole === 'kitchen' ? 'text-[var(--accent)]' : 'text-white'}>آشپزخانه</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('waiter')}
                    className={`w-full px-4 py-3 text-right hover:bg-[var(--bg-dark)] transition-colors flex items-center gap-3 ${selectedRole === 'waiter' ? 'bg-[var(--accent)]/10' : ''}`}
                  >
                    <span>🍽️</span>
                    <span className={selectedRole === 'waiter' ? 'text-[var(--accent)]' : 'text-white'}>گارسون</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Badge */}
          {currentUser && !isManager && (
            <div className={`px-4 py-2 rounded-xl ${roleColors[currentUser.role]}`}>
              <span className="font-bold">{currentUser.name}</span>
            </div>
          )}

          {/* Text Mode Toggle */}
          {selectedRole !== 'kitchen' && (
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
          )}

          {/* Audit Log Button */}
          {canViewAudit && selectedRole === 'manager' && (
            <button
              onClick={toggleAuditPanel}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-dark)] rounded-xl hover:bg-[var(--accent)]/20 transition-colors"
              aria-label="لاگ تغییرات"
            >
              <span>📋</span>
              <span className="text-sm">لاگ</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
            title="خروج"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* Clock */}
          <div className="text-right">
            <div className="text-xl font-bold text-white">{time}</div>
            <div className="text-xs text-[var(--text-secondary)]">{date}</div>
          </div>
        </div>
      </div>
      
      {/* Click outside to close role switcher */}
      {showRoleSwitcher && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setShowRoleSwitcher(false)}
        />
      )}
    </header>
  );
}
