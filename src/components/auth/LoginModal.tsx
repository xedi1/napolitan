'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * LoginModal - Secure authentication using Supabase Auth
 * 
 * SECURITY: Authentication is handled by Supabase Auth service.
 * Users are authenticated against the users table in Supabase.
 */
export function LoginModal() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { login } = useAuthStore();

  // Demo users (in production, use Supabase Auth)
  const DEMO_USERS: Record<string, { password: string; name: string; role: 'manager' | 'kitchen' | 'waiter' }> = {
    manager: { password: 'manager123', name: 'مدیریت', role: 'manager' },
    kitchen: { password: 'kitchen123', name: 'آشپزخانه', role: 'kitchen' },
    waiter: { password: 'waiter123', name: 'گارسون', role: 'waiter' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setError('');
    setIsPending(true);

    try {
      const supabase = getSupabaseClient();
      
      // Try Supabase Auth first (if configured)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isSupabaseConfigured = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co';

      if (isSupabaseConfigured) {
        // Use Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `${username}@napolitan.local`,
          password: password,
        });

        if (authError) {
          throw authError;
        }

        // Fetch user data from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();

        if (userError || !userData) {
          throw new Error('User not found');
        }

        login({
          id: userData.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          isActive: userData.is_active,
        });
      } else {
        // Fallback to demo users (for development without Supabase)
        const user = DEMO_USERS[username.toLowerCase()];
        
        if (!user || user.password !== password) {
          setError('نام کاربری یا رمز عبور اشتباه است');
          toast.error('ورود ناموفق');
          setIsPending(false);
          return;
        }

        const userId = username.toLowerCase() === 'manager' ? 1 : username.toLowerCase() === 'kitchen' ? 2 : 3;

        login({
          id: userId,
          username: username.toLowerCase(),
          name: user.name,
          role: user.role,
          isActive: true,
        });
      }
      
      toast.success('ورود موفق');
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.message || 'خطا در ورود');
      toast.error('ورود ناموفق');
    } finally {
      setIsPending(false);
    }
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

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-[var(--color-surface-light)] rounded-xl">
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
