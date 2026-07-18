'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const event = new CustomEvent('show-toast', {
    detail: { id: `toast-${++toastId}`, message, type },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleShowToast = (e: CustomEvent<Toast>) => {
      setToasts(prev => [...prev, e.detail]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== e.detail.id));
      }, 3000);
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => window.removeEventListener('show-toast', handleShowToast as EventListener);
  }, []);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-xl shadow-lg animate-enter ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-[var(--accent)]'
          } text-black font-medium`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
