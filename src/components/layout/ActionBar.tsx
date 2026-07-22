'use client';

import { useState } from 'react';
import { useUIStore, useAuthStore, useTableStore, ROLE_PERMISSIONS } from '@/store';
import type { TableShape, TableFloor, TableStatus } from '@/types';

const SHAPES: { value: TableShape; label: string; icon: string }[] = [
  { value: 'circle', label: 'گرد', icon: '⭕' },
  { value: 'rectangle', label: 'مستطیل', icon: '⬜' },
];

const FLOORS: { value: TableFloor; label: string }[] = [
  { value: 1, label: 'طبقه ۱' },
  { value: 2, label: 'طبقه ۲' },
];

const STATUSES: { value: TableStatus; label: string }[] = [
  { value: 'available', label: 'آزاد' },
  { value: 'occupied', label: 'مشغول' },
  { value: 'reserved', label: 'رزرو' },
];

function AddTableModal({ onClose }: { onClose: () => void }) {
  const { addTable } = useTableStore();
  const [shape, setShape] = useState<TableShape>('circle');
  const [seats, setSeats] = useState(4);
  const [group, setGroup] = useState('main');
  const [floor, setFloor] = useState<TableFloor>(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTable({
      shape,
      seats,
      group,
      floor,
      position: { x: positionX, y: positionY },
      status: 'available',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="panel p-6 w-96 animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">افزودن میز جدید</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shape */}
          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">شکل میز:</label>
            <div className="flex gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setShape(s.value)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    shape === s.value
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seats */}
          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">تعداد صندلی:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Floor */}
          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">طبقه:</label>
            <div className="flex gap-2">
              {FLOORS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFloor(f.value)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    floor === f.value
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--color-text-muted)] mb-2 block">موقعیت X:</label>
              <input
                type="number"
                min={0}
                max={20}
                value={positionX}
                onChange={(e) => setPositionX(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-muted)] mb-2 block">موقعیت Y:</label>
              <input
                type="number"
                min={0}
                max={20}
                value={positionY}
                onChange={(e) => setPositionY(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[var(--color-surface-elevated)] text-white rounded-xl font-bold transition-all hover:bg-[var(--color-surface-light)]"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] rounded-xl font-bold transition-all"
            >
              ✅ افزودن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ActionBar() {
  const { 
    toggleTakeaway, 
    toggleMenuManagement, 
    toggleUserManagement,
    isTakeawayOpen,
    selectedFloor,
    setSelectedFloor 
  } = useUIStore();
  const { currentUser } = useAuthStore();
  const [showAddTable, setShowAddTable] = useState(false);

  const canManageMenu = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canManageMenu;
  const canManageUsers = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canManageUsers;
  const canManageTables = currentUser?.role === 'manager';

  return (
    <>
    <div className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 flex items-center justify-between">
      {/* Left: Floor Selection + Add Table */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">طبقه:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedFloor(1)}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                selectedFloor === 1
                  ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                  : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              طبقه ۱
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
                selectedFloor === 2
                  ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                  : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              طبقه ۲
            </button>
          </div>
        </div>

        {/* Add Table Button - Manager Only */}
        {canManageTables && (
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all"
          >
            <span>➕</span>
            <span>افزودن میز</span>
          </button>
        )}
      </div>

      {/* Center: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Takeaway Button */}
        <button
          onClick={toggleTakeaway}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isTakeawayOpen
              ? 'bg-orange-500 text-white'
              : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30 border border-orange-500/30'
          }`}
        >
          <span className="text-lg">🚗</span>
          <span>سفارش بیرون‌بر</span>
        </button>

        {/* Menu Management */}
        {canManageMenu && (
          <button
            onClick={toggleMenuManagement}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white rounded-xl transition-all"
          >
            <span>📋</span>
            <span>مدیریت منو</span>
          </button>
        )}

        {/* User Management */}
        {canManageUsers && (
          <button
            onClick={toggleUserManagement}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white rounded-xl transition-all"
          >
            <span>👥</span>
            <span>مدیریت کاربران</span>
          </button>
        )}
      </div>

      {/* Right: View Mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">حالت نمایش:</span>
        <div className="flex gap-1">
          <button className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-lg text-sm font-medium">
            🏠 سه‌بعدی
          </button>
          <button className="px-3 py-1.5 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:text-white transition-all">
            📊 لیست
          </button>
        </div>
      </div>
    </div>

    {/* Add Table Modal */}
    {showAddTable && <AddTableModal onClose={() => setShowAddTable(false)} />}
    </>
  );
}
