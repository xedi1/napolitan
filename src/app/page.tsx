'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { Header } from '@/components/layout/Header';
import { StatusBar } from '@/components/layout/StatusBar';
import { ActionBar } from '@/components/layout/ActionBar';
import { OrderPanel } from '@/components/panels/OrderPanel';
import { TablePanel } from '@/components/panels/TablePanel';
import { MenuModal } from '@/components/panels/MenuModal';
import { MenuManagementPanel } from '@/components/panels/MenuManagementPanel';
import { UserManagementPanel } from '@/components/panels/UserManagementPanel';
import { AuditPanel } from '@/components/panels/AuditPanel';
import { KitchenView } from '@/components/panels/KitchenView';
import { TakeawayPanel } from '@/components/panels/TakeawayPanel';
import { DeliveryOrdersPanel } from '@/components/panels/DeliveryOrdersPanel';
import { RatingModal } from '@/components/ui/RatingModal';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useAuthStore, useUIStore, useOrderStore } from '@/store';
import { Suspense } from 'react';

// Dynamic import for floor map with drag & drop
const FloorMap = dynamic(() => import('@/components/3d/FloorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">در حال بارگذاری...</p>
      </div>
    </div>
  ),
});

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { isKitchenView, isDeliveryOrdersOpen, isTakeawayOpen, isAuditPanelOpen, isMenuManagementOpen, isUserManagementOpen } = useUIStore();
  const { orders } = useOrderStore();
  
  // Rating modal state
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  
  // Track paid orders and show rating modal
  useEffect(() => {
    const lastPaidOrder = orders
      .filter(o => o.status === 'paid' && !o.rating && o.paidAt)
      .sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0))[0];
    
    if (lastPaidOrder && lastPaidOrder.paidAt && Date.now() - lastPaidOrder.paidAt < 2000) {
      setRatingOrderId(lastPaidOrder.id);
    }
  }, [orders]);

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* Header */}
      <Header />

      {/* Status Bar */}
      <StatusBar />

      {/* Action Bar */}
      <ActionBar />

      {/* Main Content Area */}
      <div className="w-full h-[calc(100vh-140px)] relative">
        {isKitchenView ? (
          // Kitchen Display View
          <Suspense fallback={<LoadingFallback />}>
            <KitchenView />
          </Suspense>
        ) : (
          // Floor Map View (Drag & Drop)
          <Suspense fallback={<LoadingFallback />}>
            <FloorMap />
          </Suspense>
        )}
      </div>

      {/* Delivery Orders Panel (Full Screen Overlay) */}
      {isDeliveryOrdersOpen && (
        <div className="absolute inset-0 z-40">
          <DeliveryOrdersPanel />
        </div>
      )}

      {/* Panels */}
      <OrderPanel />
      <TablePanel />
      <MenuModal />
      
      {/* Takeaway Panel */}
      {isTakeawayOpen && <TakeawayPanel />}
      
      {/* Audit Panel */}
      {isAuditPanelOpen && <AuditPanel />}

      {/* Menu Management Panel */}
      {isMenuManagementOpen && <MenuManagementPanel />}

      {/* User Management Panel */}
      {isUserManagementOpen && <UserManagementPanel />}

      {/* Rating Modal - Show after payment */}
      {ratingOrderId && (
        <RatingModal
          orderId={ratingOrderId}
          tableId={orders.find(o => o.id === ratingOrderId)?.tableId || null}
          onClose={() => setRatingOrderId(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </main>
  );
}
