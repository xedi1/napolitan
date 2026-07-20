'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store';

// Quick login credentials for each role
const QUICK_LOGIN = {
  manager: { username: '09141632302', password: 'napoli.hadi.m' },
  kitchen: { username: '09141632302', password: 'napoli.hadi.a' },
  waiter: { username: '09141632302', password: 'napoli.hadi.g' },
};

export function LoginModal() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const success = login(username, password);
    if (!success) {
      setError('نام کاربری یا رمز عبور اشتباه است');
      setLoading(false);
    }
  }, [username, password, login]);

  const handleQuickLogin = useCallback(async (role: keyof typeof QUICK_LOGIN) => {
    const credentials = QUICK_LOGIN[role];
    setLoading(true);
    setError('');
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const success = login(credentials.username, credentials.password);
    if (!success) {
      setError('ورود سریع ناموفق بود');
    }
    setLoading(false);
  }, [login]);

  if (isAuthenticated) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="w-full max-w-md p-8 bg-[var(--bg-panel)] rounded-3xl shadow-2xl border border-[var(--border-color)]">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logoNAp.png" 
              alt="Napolitan Logo" 
              className="h-20 w-auto"
              onError={(e) => {
                // Fallback if logo doesn't load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden text-6xl">☕</div>
          </div>
          <h2 id="login-title" className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: '2px' }}>
            Napolitan
          </h2>
          <p className="text-[var(--text-secondary)]">
            سیستم مدیریت کافه
          </p>
        </div>

        {/* Quick Login Buttons */}
        <div className="mb-6">
          <p className="text-sm text-[var(--text-muted)] text-center mb-3">ورود سریع:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('manager')}
              disabled={loading}
              className="py-3 px-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 font-medium rounded-xl transition-all text-sm disabled:opacity-50"
            >
              👑 مدیریت
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('kitchen')}
              disabled={loading}
              className="py-3 px-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-400 font-medium rounded-xl transition-all text-sm disabled:opacity-50"
            >
              👨‍🍳 آشپزخانه
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('waiter')}
              disabled={loading}
              className="py-3 px-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 font-medium rounded-xl transition-all text-sm disabled:opacity-50"
            >
              🍽️ گارسون
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs text-[var(--text-muted)]">یا</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              نام کاربری
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              placeholder="نام کاربری را وارد کنید"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              رمز عبور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              placeholder="رمز عبور را وارد کنید"
              autoComplete="current-password"
              disabled={loading}
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
            disabled={loading}
            className="w-full py-4 bg-[var(--accent)] text-black font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                در حال ورود...
              </>
            ) : (
              'ورود به سیستم'
            )}
          </button>
        </form>


      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
