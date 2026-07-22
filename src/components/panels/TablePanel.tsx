'use client';

import { useState } from 'react';
import { useTableStore, useOrderStore, useAuthStore } from '@/store';
import { getStatusLabel } from '@/lib/utils';
import type { TableStatus } from '@/types';
import { toast } from 'sonner';

const STATUS_CYCLE: TableStatus[] = ['available', 'occupied', 'preparing', 'awaiting', 'eating', 'cleaning'];

/**
 * TablePanel - Quick actions for selected table
 * Status changes and new order creation
 * (Add/Edit/Delete is now in FloorMap for managers)
 */
export function TablePanel() {
  const { selectedTableId, selectTable, tables, updateTableStatus } = useTableStore();
  const { currentOrder, createOrder, setCurrentOrder } = useOrderStore();
  const { currentUser } = useAuthStore();

  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const isManager = currentUser?.role === 'manager';

  if (!selectedTableId || !selectedTable) return null;

  const handleClose = () => selectTable(null);

  const handleNewOrder = () => {
    if (!currentUser) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }

    // If there's already items in current order, warn user
    if (currentOrder && currentOrder.items.length > 0) {
      if (!confirm('سفارش فعلی دارای آیتم است. آیا می‌خواهید سفارش جدید شروع کنید؟')) {
        return;
      }
    }

    // Create a new empty order for this table
    const newOrder = createOrder(selectedTableId, [], currentUser.id);
    
    // Update table status to occupied
    updateTableStatus(selectedTableId, 'occupied');
    
    setCurrentOrder(newOrder);
    toast.success(`سفارش جدید برای میز ${selectedTableId} ایجاد شد`);
  };

  const handleStatusChange = (newStatus: TableStatus) => {
    if (!selectedTableId) return;
    updateTableStatus(selectedTableId, newStatus);
    toast.success(`وضعیت میز به "${getStatusLabel(newStatus)}" تغییر کرد`);
    setShowStatusMenu(false);
  };

  const handleReserve = () => {
    handleStatusChange('reserved');
    toast.success('میز رزرو شد');
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 panel z-20 animate-slideUp">
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">میز {selectedTable.id}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {selectedTable.seats} نفره • {selectedTable.shape === 'circle' ? 'گرد' : 'مستطیل'}
          </p>
        </div>
        <button onClick={handleClose} className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="relative">
          <label className="text-xs text-[var(--color-text-muted)] mb-1 block">وضعیت:</label>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-light)] text-white font-medium`}>
            <span className={`w-2 h-2 rounded-full ${
              selectedTable.status === 'available' ? 'bg-green-500' :
              selectedTable.status === 'occupied' ? 'bg-red-500' :
              selectedTable.status === 'preparing' ? 'bg-orange-500' :
              selectedTable.status === 'reserved' ? 'bg-yellow-500' :
              'bg-cyan-500'
            }`} />
            {getStatusLabel(selectedTable.status)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={handleNewOrder}
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>ثبت سفارش جدید</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Status Change Button */}
            <div className="relative">
              <button 
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="w-full py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-all text-sm"
              >
                🔄 تغییر وضعیت
              </button>
              
              {/* Status Dropdown Menu */}
              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-[var(--color-surface-elevated)] rounded-lg shadow-xl border border-[var(--color-border)] overflow-hidden z-30">
                  {STATUS_CYCLE.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`w-full px-3 py-2 text-right text-sm hover:bg-[var(--color-surface-light)] transition-all ${
                        selectedTable.status === status ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'text-white'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Reserve Button */}
            <button 
              onClick={handleReserve}
              className="py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-all text-sm"
            >
              📅 رزرو میز
            </button>
          </div>

          {/* Manager Note */}
          {isManager && (
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              💡 برای ویرایش/حذف میز، روی میز در نقشه کلیک کنید
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
