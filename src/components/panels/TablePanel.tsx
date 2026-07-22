'use client';

import { useState } from 'react';
import { useTableStore, useUIStore, useOrderStore } from '@/store';
import { formatPrice, getStatusLabel } from '@/lib/utils';
import type { TableStatus, TableShape } from '@/types';
import { toast } from 'sonner';

const STATUS_CYCLE: TableStatus[] = ['available', 'occupied', 'preparing', 'awaiting', 'eating', 'cleaning'];

export function TablePanel() {
  const { selectedTableId, selectTable, tables, updateTableStatus, updateTable, addTable } = useTableStore();
  const { selectedFloor } = useUIStore();
  const { setCurrentOrder } = useOrderStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [newTable, setNewTable] = useState({
    seats: 4,
    shape: 'circle' as TableShape,
    group: 'main',
  });

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  if (!selectedTableId || !selectedTable) return null;

  const handleClose = () => selectTable(null);

  const handleNewOrder = () => {
    setCurrentOrder(null);
  };

  const handleStatusChange = (newStatus: TableStatus) => {
    if (!selectedTableId) return;
    updateTableStatus(selectedTableId, newStatus);
    toast.success(`وضعیت میز به "${getStatusLabel(newStatus)}" تغییر کرد`);
    setShowStatusMenu(false);
  };

  const handleCycleStatus = () => {
    if (!selectedTable) return;
    const currentIndex = STATUS_CYCLE.indexOf(selectedTable.status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    handleStatusChange(STATUS_CYCLE[nextIndex]);
  };

  const handleReserve = () => {
    handleStatusChange('reserved');
    toast.success('میز رزرو شد');
  };

  const handleAddTable = () => {
    const maxId = Math.max(...tables.map(t => t.id), 0);
    const newTableData = {
      ...newTable,
      position: { x: maxId % 3, y: Math.floor(maxId / 3) },
      status: 'available' as const,
      floor: selectedFloor,
    };
    addTable(newTableData);
    toast.success('میز جدید اضافه شد');
    setShowAddForm(false);
    setNewTable({ seats: 4, shape: 'circle', group: 'main' });
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

          {/* Add New Table Section */}
          {showAddForm ? (
            <div className="p-3 bg-[var(--color-surface-light)] rounded-xl space-y-3">
              <p className="text-sm font-medium text-white">افزودن میز جدید</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">تعداد صندلی</label>
                  <select 
                    value={newTable.seats}
                    onChange={(e) => setNewTable({...newTable, seats: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white text-sm"
                  >
                    <option value={2}>۲ نفره</option>
                    <option value={4}>۴ نفره</option>
                    <option value={6}>۶ نفره</option>
                    <option value={8}>۸ نفره</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">شکل</label>
                  <select 
                    value={newTable.shape}
                    onChange={(e) => setNewTable({...newTable, shape: e.target.value as TableShape})}
                    className="w-full mt-1 px-2 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white text-sm"
                  >
                    <option value="circle">گرد</option>
                    <option value="rectangle">مستطیل</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleAddTable}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all"
                >
                  ✓ افزودن
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] rounded-lg text-sm transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-all text-sm font-medium border border-green-600/30"
            >
              ➕ افزودن میز جدید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
