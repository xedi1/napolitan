'use client';

import dynamic from 'next/dynamic';
import { LoginModal } from '@/components/LoginModal';
import { Header } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { TablePanel } from '@/components/TablePanel';
import { MenuModal } from '@/components/MenuModal';
import { OrderPanel } from '@/components/OrderPanel';
import { AuditPanel } from '@/components/AuditPanel';
import { TextFallback } from '@/components/TextFallback';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { ToastContainer } from '@/components/ToastContainer';

// Dynamic import for 3D scene (client-side only)
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-[var(--text-secondary)]">
        در حال بارگذاری صحنه سه‌بعدی...
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <AccessibilityProvider>
      <main className="relative w-full h-screen overflow-hidden">
        {/* Loading Overlay */}
        <div className="loading-overlay" id="loading">
          <div className="loading-spinner" />
          <div className="loading-text">بارگذاری Cafe Napoli...</div>
        </div>

        {/* Login Modal */}
        <LoginModal />

        {/* Header */}
        <Header />

        {/* Status Bar */}
        <StatusBar />

        {/* Main Content */}
        <div className="absolute inset-0 pt-32 pb-20">
          {/* 3D Scene or Text Fallback */}
          <div className="canvas-container" id="scene-container">
            <Scene3D />
          </div>
          <TextFallback />
        </div>

        {/* Panels */}
        <TablePanel />
        <OrderPanel />
        <AuditPanel />

        {/* Menu Modal */}
        <MenuModal />

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Screen Reader Live Regions */}
        <div id="a11y-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
        <div id="a11y-announcements" className="sr-only" aria-live="assertive" />
      </main>
    </AccessibilityProvider>
  );
}
