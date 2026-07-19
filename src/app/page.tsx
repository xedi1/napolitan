'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoginModal } from '@/components/LoginModal';
import { RoleMenu } from '@/components/RoleMenu';
import { Header } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { TablePanel } from '@/components/TablePanel';
import { MenuModal } from '@/components/MenuModal';
import { OrderPanel } from '@/components/OrderPanel';
import { AuditPanel } from '@/components/AuditPanel';
import { TextFallback } from '@/components/TextFallback';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { ToastContainer } from '@/components/ToastContainer';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { KitchenView } from '@/components/KitchenView';
import { useAuthStore, useOrderStore } from '@/store';
import type { MenuItemData } from '@/lib/data';

// Dynamic import for 3D scene (client-side only) with code splitting
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-[var(--text-secondary)] flex flex-col items-center gap-4">
        <div className="text-4xl">☕</div>
        <div>در حال بارگذاری صحنه سه‌بعدی...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const { isAuthenticated, selectedRole } = useAuthStore();
  const { addItemToCurrentOrder } = useOrderStore();

  useEffect(() => {
    const handleOpenMenu = () => setMenuOpen(true);
    window.addEventListener('open-menu-modal', handleOpenMenu);
    
    // Toggle performance monitor with Alt+P
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPerformance(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('open-menu-modal', handleOpenMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle adding item from menu to order
  const handleAddMenuItem = (item: MenuItemData) => {
    addItemToCurrentOrder({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  // Show loading if not authenticated or role not selected
  if (!isAuthenticated || !selectedRole) {
    return (
      <AccessibilityProvider>
        <main className="relative w-full h-screen overflow-hidden">
          {/* Loading Overlay */}
          <div className="loading-overlay" id="loading">
            <div className="loading-spinner" />
            <div className="loading-text">بارگذاری Napolitian...</div>
          </div>

          {/* Login Modal */}
          <LoginModal />

          {/* Role Selection Menu */}
          <RoleMenu />
        </main>
      </AccessibilityProvider>
    );
  }

  // Kitchen View
  if (selectedRole === 'kitchen') {
    return (
      <AccessibilityProvider>
        <main className="relative w-full h-screen overflow-hidden">
          {/* Login Modal (hidden if authenticated) */}
          <LoginModal />
          
          {/* Header for Kitchen */}
          <Header />

          {/* Kitchen Content */}
          <div className="absolute inset-0 pt-20">
            <KitchenView />
          </div>

          {/* Toast Notifications */}
          <ToastContainer />
        </main>
      </AccessibilityProvider>
    );
  }

  // Manager/Waiter View (with 3D scene)
  return (
    <AccessibilityProvider>
      <main className="relative w-full h-screen overflow-hidden">
        {/* Loading Overlay - hide after load */}
        <div className="loading-overlay" id="loading">
          <div className="loading-spinner" />
          <div className="loading-text">بارگذاری Napolitian...</div>
        </div>

        {/* Login Modal (hidden if authenticated) */}
        <LoginModal />

        {/* Role Selection Menu */}
        <RoleMenu />

        {/* Header */}
        <Header />

        {/* Status Bar */}
        <StatusBar />

        {/* Main Content */}
        <div className="absolute inset-0 pt-20 pb-0">
          {/* 3D Scene with Suspense */}
          <div className="canvas-container" id="scene-container">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-[var(--text-secondary)]">
                  در حال بارگذاری...
                </div>
              </div>
            }>
              <Scene3D />
            </Suspense>
          </div>
          <TextFallback />
        </div>

        {/* Panels */}
        <TablePanel onOpenMenu={() => setMenuOpen(true)} />
        <OrderPanel />
        <AuditPanel />

        {/* Menu Modal - Connected to order system */}
        <MenuModal 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          onAddItem={handleAddMenuItem}
        />

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Performance Monitor (Alt+P to toggle) */}
        <PerformanceMonitor showInUI={showPerformance} />

        {/* Screen Reader Live Regions */}
        <div id="a11y-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
        <div id="a11y-announcements" className="sr-only" aria-live="assertive" />
      </main>
    </AccessibilityProvider>
  );
}
