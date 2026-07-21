'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';

export function LoginModal() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'ورود ناموفق');
          toast.error('ورود ناموفق');
          return;
        }

        // Store tokens
        localStorage.setItem('napoli-access-token', data.accessToken);
        localStorage.setItem('napoli-refresh-token', data.refreshToken);

        // Login user
        login(data.user);
        toast.success('ورود موفق');
        
      } catch (err) {
        console.error('[Login] Error:', err);
        setError('خطا در اتصال به سرور');
        toast.error('خطا در اتصال');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-md p-8 panel animate-scaleIn">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center">
              <span className="text-4xl">☕</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Napolitan
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            سیستم مدیریت کافه
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              نام کاربری
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
              placeholder="نام کاربری..."
              autoComplete="username"
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              رمز عبور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
              placeholder="رمز عبور..."
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                در حال ورود...
              </>
            ) : (
              'ورود به سیستم'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
            <span>🔒</span>
            احراز هویت امن با رمزنگاری پیشرفته
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-[var(--color-surface-light)] rounded-xl">
          <p className="text-xs text-[var(--color-text-secondary)] text-center mb-2">
            اطلاعات ورود نمونه:
          </p>
          <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
            <p><strong>مدیر:</strong> manager / manager123</p>
            <p><strong>آشپزخانه:</strong> kitchen / kitchen123</p>
            <p><strong>گارسون:</strong> waiter / waiter123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
