'use client';

import { useEffect } from 'react';
import { useAuthStore, ROLE_PERMISSIONS } from '@/store';
import type { UserRole } from '@/types';

interface RoleOption {
  role: UserRole;
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'manager',
    title: 'مدیریت',
    icon: '👑',
    description: 'دسترسی کامل به همه بخش‌ها',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    role: 'kitchen',
    title: 'آشپزخانه',
    icon: '👨‍🍳',
    description: 'مشاهده سفارش‌های آماده‌سازی',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    role: 'waiter',
    title: 'گارسون',
    icon: '🍽️',
    description: 'مشاهده میزها و ثبت سفارش',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
];

export function RoleMenu() {
  const { currentUser, selectedRole, selectRole } = useAuthStore();

  // Auto-select role for non-manager users in useEffect (not in render body)
  useEffect(() => {
    if (currentUser && selectedRole === null && currentUser.role !== 'manager') {
      selectRole(currentUser.role);
    }
  }, [currentUser, selectedRole, selectRole]);

  if (!currentUser || selectedRole) return null;

  const handleSelectRole = (role: UserRole) => {
    selectRole(role);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
      <div className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logo.svg" 
              alt="Napolitian" 
              className="h-24 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentUser.name} خوش آمدید
          </h2>
          <p className="text-[var(--text-secondary)]">
            نقش مورد نظر را انتخاب کنید
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleOptions.map((option) => (
            <button
              key={option.role}
              onClick={() => handleSelectRole(option.role)}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${option.gradient} border border-[var(--border-color)] hover:border-[var(--accent)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group text-right`}
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{option.icon}</div>
              
              {/* Title */}
              <h3 className={`text-xl font-bold ${option.color} mb-2`}>
                {option.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)]">
                {option.description}
              </p>
              
              {/* Permissions indicator */}
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <div className="flex flex-wrap gap-1">
                  {option.role === 'manager' && (
                    <>
                      <PermissionBadge>میزها</PermissionBadge>
                      <PermissionBadge>سفارشات</PermissionBadge>
                      <PermissionBadge>آشپزخانه</PermissionBadge>
                      <PermissionBadge>لاگ</PermissionBadge>
                    </>
                  )}
                  {option.role === 'kitchen' && (
                    <>
                      <PermissionBadge>بار سرد</PermissionBadge>
                      <PermissionBadge>بار گرم</PermissionBadge>
                    </>
                  )}
                  {option.role === 'waiter' && (
                    <>
                      <PermissionBadge>میزها</PermissionBadge>
                      <PermissionBadge>منو</PermissionBadge>
                    </>
                  )}
                </div>
              </div>

              {/* Hover indicator */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[var(--accent)]">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <p className="text-center text-[var(--text-muted)] text-sm mt-8">
          برای تغییر نقش، از منوی بالا استفاده کنید
        </p>
      </div>
    </div>
  );
}

function PermissionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-xs bg-[var(--bg-dark)] rounded-full text-[var(--text-secondary)]">
      {children}
    </span>
  );
}
