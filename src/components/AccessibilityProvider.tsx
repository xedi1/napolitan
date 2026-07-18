'use client';

import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/store';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { toggleTextMode } = useUIStore();

  const announce = useCallback((message: string) => {
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.textContent = '';
      setTimeout(() => { liveRegion.textContent = message; }, 100);
    }
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTextMode();
        announce('حالت نمایش تغییر کرد');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTextMode, announce]);

  useEffect(() => {
    // Initial announcement
    const timer = setTimeout(() => {
      announce('کافه ناپل بارگذاری شد. برای ناوبری از Tab و کلیدهای جهت‌نما استفاده کنید.');
    }, 1000);
    return () => clearTimeout(timer);
  }, [announce]);

  return <>{children}</>;
}
