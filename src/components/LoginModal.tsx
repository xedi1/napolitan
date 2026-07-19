'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store';

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

        {/* Quick Login Buttons */}
        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] text-center mb-4">
            ورود سریع:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setUsername('gmodiriat'); setPassword('1saeid'); }}
              className="px-3 py-2 text-sm bg-[var(--bg-dark)] rounded-lg hover:bg-yellow-400/10 transition-colors border border-[var(--border-color)] hover:border-yellow-400/30"
            >
              <span className="block text-yellow-400 font-bold">مدیریت</span>
              <span className="text-xs text-[var(--text-muted)]">gmodiriat</span>
            </button>
            <button
              onClick={() => { setUsername('gashpaz'); setPassword('1saeid'); }}
              className="px-3 py-2 text-sm bg-[var(--bg-dark)] rounded-lg hover:bg-orange-400/10 transition-colors border border-[var(--border-color)] hover:border-orange-400/30"
            >
              <span className="block text-orange-400 font-bold">آشپزخانه</span>
              <span className="text-xs text-[var(--text-muted)]">gashpaz</span>
            </button>
            <button
              onClick={() => { setUsername('gnapoli'); setPassword('1saeid'); }}
              className="px-3 py-2 text-sm bg-[var(--bg-dark)] rounded-lg hover:bg-green-400/10 transition-colors border border-[var(--border-color)] hover:border-green-400/30"
            >
              <span className="block text-green-400 font-bold">گارسون</span>
              <span className="text-xs text-[var(--text-muted)]">gnapoli</span>
            </button>
          </div>
        </div>
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
