'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useUIStore, useTableStore } from '@/store';

const COLUMNS = 2;

export function TextFallback() {
  const { isTextMode } = useUIStore();
  const { tables, selectTable, selectedTableId } = useTableStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Sort tables: right side first, then left side, by ID within each group
  const sortedTables = [...tables].sort((a, b) => {
    // First sort by group (right before left)
    const aIsRight = a.group.includes('راست');
    const bIsRight = b.group.includes('راست');
    if (aIsRight && !bIsRight) return -1;
    if (!aIsRight && bIsRight) return 1;
    // Then by ID within group
    return a.id - b.id;
  });

  // Get current index in sortedTables
  const currentIndex = selectedTableId 
    ? sortedTables.findIndex(t => t.id === selectedTableId)
    : 0;

  // Move selection with arrow keys
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (sortedTables.length === 0) return;
    
    let newIndex = currentIndex;
    switch (direction) {
      case 'up':
        newIndex = Math.max(0, currentIndex - COLUMNS);
        break;
      case 'down':
        newIndex = Math.min(sortedTables.length - 1, currentIndex + COLUMNS);
        break;
      case 'left':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'right':
        newIndex = Math.min(sortedTables.length - 1, currentIndex + 1);
        break;
    }
    
    if (newIndex !== currentIndex) {
      selectTable(sortedTables[newIndex].id);
      tableRefs.current.get(sortedTables[newIndex].id)?.focus();
    }
  }, [currentIndex, sortedTables, selectTable]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isTextMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection('right');
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedTableId !== null) {
            selectTable(selectedTableId);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTextMode, moveSelection, selectedTableId, selectTable]);

  if (!isTextMode) return null;

  const statusLabels: Record<string, string> = {
    available: 'خالی - آماده پذیرایی',
    occupied: 'اشغال شده',
    preparing: 'در حال آماده‌سازی',
    awaiting: 'در انتظار پرداخت',
    eating: 'در حال صرف غذا',
    reserved: 'رزرو شده',
    cleaning: 'در حال تمیز کردن',
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pt-32 pb-20 bg-[var(--bg-dark)] overflow-auto p-8"
      role="application"
      aria-label="نمای جدول‌ها"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">🍽️ Cafe Napoli - نمای جدول‌ها</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Alt+T: تغییر حالت | کلیدهای جهت‌نما: ناوبری | Enter: انتخاب
        </p>
        
        <div className="grid grid-cols-2 gap-4" role="grid" aria-label="میزها">
          {sortedTables.map((table, index) => (
            <button
              key={table.id}
              ref={(el) => {
                if (el) tableRefs.current.set(table.id, el);
              }}
              onClick={() => selectTable(table.id)}
              onFocus={() => selectTable(table.id)}
              className={`p-4 rounded-xl border-2 text-right transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                selectedTableId === table.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-color)] hover:border-[var(--accent)]/50'
              }`}
              role="gridcell"
              aria-selected={selectedTableId === table.id}
              tabIndex={selectedTableId === table.id || (selectedTableId === null && index === 0) ? 0 : -1}
            >
              <div className="text-xl font-bold">میز {table.id}</div>
              <div className={`text-sm ${
                table.status === 'available' ? 'text-green-400' :
                table.status === 'occupied' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {statusLabels[table.status]}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {table.group} - {table.seats} نفره
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
