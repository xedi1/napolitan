'use client';

import { useState, useCallback } from 'react';
import { useAuthStore, ROLE_PERMISSIONS } from '@/store';

export function LoginModal() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { login, isAuthenticated } = useAuthStore();

  const handleKeyPress = useCallback((value: string) => {
    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        const success = login(newPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  }, [pin, login]);

  const handleClear = useCallback(() => {
    setPin('');
    setError(false);
  }, []);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const users = [
    { pin: '1234', name: 'مدیر', role: 'manager' as const },
    { pin: '5678', name: 'سرپرست', role: 'supervisor' as const },
    { pin: '0000', name: 'گارسون', role: 'waiter' as const },
  ];

  if (isAuthenticated) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="w-full max-w-sm p-8 bg-[var(--bg-panel)] rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">☕</div>
          <h2 id="login-title" className="text-2xl font-bold text-white mb-2">
            Cafe Napoli
          </h2>
          <p className="text-[var(--text-secondary)]">
            برای دسترسی PIN وارد کنید
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'bg-transparent border-[var(--border-color)]'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-center text-red-400 text-sm mb-4 animate-shake">
            PIN نامعتبر است
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'clear') handleClear();
                else if (key === 'back') handleBackspace();
                else handleKeyPress(String(key));
              }}
              className={`p-4 text-xl font-bold rounded-xl transition-all duration-150 active:scale-95 ${
                key === 'clear'
                  ? 'text-yellow-400 bg-[var(--bg-dark)] border border-[var(--border-color)]'
                  : key === 'back'
                  ? 'text-red-400 bg-[var(--bg-dark)] border border-[var(--border-color)]'
                  : 'bg-[var(--bg-dark)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10'
              }`}
            >
              {key === 'clear' ? 'پاک' : key === 'back' ? '⌫' : key}
            </button>
          ))}
        </div>

        {/* User Hints */}
        <div className="border-t border-[var(--border-color)] pt-6">
          <p className="text-xs text-[var(--text-muted)] text-center mb-4">
            کاربران سیستم:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {users.map((user) => (
              <button
                key={user.pin}
                onClick={() => {
                  setPin(user.pin);
                  setTimeout(() => login(user.pin), 100);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--bg-dark)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
              >
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    user.role === 'manager'
                      ? 'bg-yellow-400 text-black'
                      : user.role === 'supervisor'
                      ? 'bg-[var(--accent)] text-black'
                      : 'bg-green-400 text-black'
                  }`}
                >
                  {user.name}
                </span>
                <span className="text-[var(--text-muted)]">PIN: {user.pin}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
