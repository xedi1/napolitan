'use client';

import { useEffect, useRef } from 'react';
import { useTableStore, useOrderStore, useAuditStore, useAuthStore, ROLE_PERMISSIONS } from '@/store';
import { formatPrice } from '@/lib/utils';
import type { TableStatus } from '@/types';

interface TablePanelProps {
  onOpenMenu?: () => void;
  onOpenPrint?: () => void;
}

// Auto status progression timers
const statusTimers: Map<number, NodeJS.Timeout[]> = new Map();

export function TablePanel({ onOpenMenu, onOpenPrint }: TablePanelProps) {
  const { tables, selectedTableId, selectTable, setTableStatus } = useTableStore();
  const { orders, addOrder, setCurrentOrder, currentOrder } = useOrderStore();
  const { addEntry } = useAuditStore();
  const { currentUser } = useAuthStore();
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableOrder = orders.find(o => o.tableId === selectedTableId);
  const hasActiveOrder = currentOrder && currentOrder.tableId === selectedTableId ? currentOrder : null;

  const hasOrderToPrint = hasActiveOrder && hasActiveOrder.items.length > 0;

  // Permission checks - waiter can view but not modify
  const canModify = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canUpdateStatus;
  const canTakeOrder = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canTakeOrder;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleStatusChange = (status: TableStatus) => {
    if (!canModify || !selectedTable) return;
    setTableStatus(selectedTable.id, status);
    addEntry({
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'سیستم',
      userRole: currentUser?.role || 'waiter',
      action: 'تغییر وضعیت',
      actionType: 'status',
      details: `میز ${selectedTable.id} به وضعیت ${status} تغییر کرد`,
      tableId: selectedTable.id,
    });
  };

  const clearTableTimers = (tableId: number) => {
    const timers = statusTimers.get(tableId);
    if (timers) {
      timers.forEach(t => clearTimeout(t));
      statusTimers.delete(tableId);
    }
  };

  const handleNewOrder = () => {
    if (!canTakeOrder || !selectedTable) return;
    
    // Clear any existing timers for this table
    clearTableTimers(selectedTable.id);
    
    const newOrder = {
      id: `order-${Date.now()}`,
      tableId: selectedTable.id,
      items: [],
      status: 'pending' as const,
      subtotal: 0,
      total: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser?.id || 0,
    };
    addOrder(newOrder);
    setCurrentOrder(newOrder);
    
    // Start auto status progression
    const timers: NodeJS.Timeout[] = [];
    
    // Step 1: After 2 minutes -> preparing
    const timer1 = setTimeout(() => {
      setTableStatus(selectedTable.id, 'preparing');
      addEntry({
        userId: 0,
        userName: 'سیستم',
        userRole: 'waiter',
        action: 'تغییر خودکار',
        actionType: 'status',
        details: `میز ${selectedTable.id} به آماده‌سازی تغییر کرد (خودکار)`,
        tableId: selectedTable.id,
      });
    }, 2 * 60 * 1000); // 2 minutes
    timers.push(timer1);
    
    // Step 2: After 10 more minutes (12 total) -> eating
    const timer2 = setTimeout(() => {
      setTableStatus(selectedTable.id, 'eating');
      addEntry({
        userId: 0,
        userName: 'سیستم',
        userRole: 'waiter',
        action: 'تغییر خودکار',
        actionType: 'status',
        details: `میز ${selectedTable.id} در حال صرف غذا`,
        tableId: selectedTable.id,
      });
    }, 12 * 60 * 1000); // 12 minutes total
    timers.push(timer2);
    
    statusTimers.set(selectedTable.id, timers);
    timersRef.current = timers;
    
    // Initial status
    setTableStatus(selectedTable.id, 'occupied');
    addEntry({
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'سیستم',
      userRole: currentUser?.role || 'waiter',
      action: 'ثبت سفارش',
      actionType: 'order',
      details: `سفارش جدید برای میز ${selectedTable.id}`,
      tableId: selectedTable.id,
    });
    
    onOpenMenu?.();
  };

  const handleShowMenu = () => {
    // If no order exists, create one first
    if (!tableOrder && !hasActiveOrder) {
      handleNewOrder();
    } else {
      // Ensure current order is set to tableOrder if exists
      if (tableOrder && currentOrder?.id !== tableOrder.id) {
        setCurrentOrder(tableOrder);
      }
      onOpenMenu?.();
    }
  };

  if (!selectedTableId || !selectedTable) return null;

  const statusLabels: Record<string, string> = {
    available: 'خالی',
    occupied: 'اشغال',
    preparing: 'آماده‌سازی',
    awaiting: 'در انتظار',
    eating: 'در حال صرف',
    reserved: 'رزرو',
    cleaning: 'تمیزکاری',
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 panel p-4 z-20 animate-enter">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">میز {selectedTable.id}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{selectedTable.group}</p>
        </div>
        <button
          onClick={() => selectTable(null)}
          className="p-2 hover:bg-[var(--bg-dark)] rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <p className="text-xs text-[var(--text-muted)] mb-2">وضعیت:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as typeof selectedTable.status)}
              disabled={!canModify}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedTable.status === key
                  ? 'bg-[var(--accent)] text-black'
                  : canModify
                  ? 'bg-[var(--bg-dark)] hover:bg-[var(--accent)]/20 cursor-pointer'
                  : 'bg-[var(--bg-dark)] cursor-not-allowed opacity-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Info */}
      {hasActiveOrder ? (
        <div className="mb-4 p-3 bg-[var(--bg-dark)] rounded-lg">
          <p className="text-sm font-medium mb-2">سفارش فعلی:</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {hasActiveOrder.items.length} آیتم - {formatPrice(hasActiveOrder.subtotal)}
          </p>
        </div>
      ) : tableOrder ? (
        <div className="mb-4 p-3 bg-[var(--bg-dark)] rounded-lg">
          <p className="text-sm font-medium mb-2">سفارش فعلی:</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {tableOrder.items.length} آیتم - {formatPrice(tableOrder.total)}
          </p>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={handleShowMenu}
          className="flex-1 btn-secondary text-sm"
        >
          📋 نمایش منو
        </button>
        <button 
          onClick={onOpenPrint}
          className="flex-1 btn-secondary text-sm"
        >
          🖨️ پرینت
        </button>
      </div>
    </div>
  );
}
