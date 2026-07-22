'use client';

import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTableStore, useUIStore, useOrderStore, useAuthStore } from '@/store';
import { getStatusLabel } from '@/lib/utils';
import type { Table, TableShape, TableStatus, TableFloor } from '@/types';
import { toast } from 'sonner';

// Status colors with CSS variables for theming
const STATUS_COLORS: Record<TableStatus, string> = {
  available: 'var(--color-success, #22c55e)',
  occupied: 'var(--color-danger, #ef4444)',
  preparing: 'var(--color-warning, #f97316)',
  awaiting: 'var(--color-accent, #eab308)',
  eating: 'var(--color-info, #3b82f6)',
  reserved: 'var(--color-purple, #a855f7)',
  cleaning: 'var(--color-cyan, #06b6d4)',
};

// ============================================
// Memoized Table Component
// ============================================
interface TableItemProps {
  table: Table;
  isSelected: boolean;
  isDragging: boolean;
  isManager: boolean;
  onSelect: (id: number) => void;
  onDragStart: (e: React.MouseEvent, table: Table) => void;
  onEdit: (table: Table) => void;
  onDelete: (id: number) => void;
}

const TableItem = memo(function TableItem({
  table,
  isSelected,
  isDragging,
  isManager,
  onSelect,
  onDragStart,
  onEdit,
  onDelete,
}: TableItemProps) {
  const statusColor = STATUS_COLORS[table.status];
  
  return (
    <div
      className={`
        absolute select-none
        ${isDragging ? 'z-50 scale-110' : 'z-10'}
        ${isSelected ? 'z-20' : ''}
      `}
      style={{
        left: `${table.position.x * 60}px`,
        top: `${table.position.y * 60}px`,
        transform: 'translate3d(0, 0, 0)', // Force GPU layer
      }}
      onMouseDown={(e) => isManager && onDragStart(e, table)}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onSelect(table.id);
        }
      }}
    >
      {/* Table Shape */}
      <div
        className={`
          relative flex items-center justify-center
          transition-all duration-200 ease-out
          ${table.shape === 'circle' 
            ? 'w-[70px] h-[70px] rounded-full' 
            : 'w-[90px] h-[60px] rounded-2xl'
          }
          ${isSelected 
            ? 'ring-4 ring-offset-2 ring-offset-[var(--color-surface)] ring-[var(--color-accent)]' 
            : 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-[var(--color-surface)] hover:ring-white/30'
          }
          ${isManager ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isDragging ? 'opacity-80 shadow-2xl' : 'shadow-lg'}
        `}
        style={{
          backgroundColor: `${statusColor}25`,
          borderColor: statusColor,
          borderWidth: '2px',
          borderStyle: 'solid',
        }}
      >
        {/* Table Content */}
        <div className="text-center pointer-events-none">
          <span 
            className="text-xl font-bold text-white block"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {table.id}
          </span>
          <span className="text-xs text-white/70">
            {table.seats} نفر
          </span>
        </div>

        {/* Status Indicator */}
        <div
          className={`
            absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--color-surface)]
            ${table.status !== 'available' ? 'animate-pulse' : ''}
          `}
          style={{ backgroundColor: statusColor }}
        />
      </div>

      {/* Action Buttons (when selected and manager) */}
      {isSelected && isManager && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex gap-1 animate-fadeIn"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(table);
            }}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(table.id);
            }}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison for memo - only re-render if these specific values change
  return (
    prev.table.id === next.table.id &&
    prev.table.status === next.table.status &&
    prev.table.position.x === next.table.position.x &&
    prev.table.position.y === next.table.position.y &&
    prev.table.seats === next.table.seats &&
    prev.table.shape === next.table.shape &&
    prev.isSelected === next.isSelected &&
    prev.isDragging === next.isDragging &&
    prev.isManager === next.isManager
  );
});

// ============================================
// Main FloorMap Component
// ============================================
export default function FloorMap() {
  // Precise selectors to avoid unnecessary re-renders
  const tables = useTableStore((s) => s.tables);
  const selectedTableId = useTableStore((s) => s.selectedTableId);
  const selectTable = useTableStore((s) => s.selectTable);
  const updateTable = useTableStore((s) => s.updateTable);
  // Note: addTable and removeTable are NOT used here - we use webSync.syncAddTable/syncRemoveTable
  // to get auto-increment IDs from the database
  
  const selectedFloor = useUIStore((s) => s.selectedFloor);
  const setSelectedFloor = useUIStore((s) => s.setSelectedFloor);
  
  const setCurrentOrder = useOrderStore((s) => s.setCurrentOrder);
  
  const currentUser = useAuthStore((s) => s.currentUser);

  const isManager = currentUser?.role === 'manager';

  const [dragState, setDragState] = useState<{ tableId: number; offsetX: number; offsetY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);
  const [newTable, setNewTable] = useState<{ seats: number; shape: TableShape }>({ seats: 4, shape: 'circle' });

  const mapRef = useRef<HTMLDivElement>(null);

  // Memoized floor tables - only recomputes when tables or floor changes
  const floorTables = useMemo(
    () => tables.filter((t) => t.floor === selectedFloor),
    [tables, selectedFloor]
  );

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent, table: Table) => {
    if (!isManager) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).closest('[class*="absolute"]')?.getBoundingClientRect();
    if (!rect) return;
    
    setDragState({
      tableId: table.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, [isManager]);

  useEffect(() => {
    if (!dragState || !mapRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const mapRect = mapRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - mapRect.left - dragState.offsetX, mapRect.width - 80));
      const y = Math.max(0, Math.min(e.clientY - mapRect.top - dragState.offsetY, mapRect.height - 80));
      
      // Snap to 60px grid
      const gridX = Math.round(x / 60);
      const gridY = Math.round(y / 60);
      
      updateTable(dragState.tableId, {
        position: { x: gridX, y: gridY }
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, updateTable]);

  // Handlers
  const handleSelect = useCallback((tableId: number) => {
    selectTable(tableId);
    setCurrentOrder(null);
  }, [selectTable, setCurrentOrder]);

  const handleEditTable = useCallback((table: Table) => {
    setEditTable({ ...table });
    setShowEditForm(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editTable) return;
    // Use webSync to update table - syncs with database
    const { webSync } = await import('@/lib/webSync');
    updateTable(editTable.id, {
      seats: editTable.seats,
      shape: editTable.shape,
    });
    // Also sync to database
    webSync.syncTableUpdate(editTable.id, {
      seats: editTable.seats,
      shape: editTable.shape,
    }).catch(console.error);
    toast.success('میز ویرایش شد');
    setShowEditForm(false);
    setEditTable(null);
  }, [editTable, updateTable]);

  const handleDeleteTable = useCallback(() => {
    if (!tableToDelete) return;
    // Use webSync for deletion to sync with database
    import('@/lib/webSync').then(({ webSync }) => {
      webSync.syncRemoveTable(tableToDelete).catch(console.error);
    });
    toast.success('میز حذف شد');
    setTableToDelete(null);
    selectTable(null);
  }, [tableToDelete, selectTable]);

  const handleAddTable = useCallback(async () => {
    const maxX = Math.max(0, ...floorTables.map((t) => t.position.x)) + 1;
    // Use webSync to add table - gets auto-increment ID from database
    const { webSync } = await import('@/lib/webSync');
    await webSync.syncAddTable({
      seats: newTable.seats,
      shape: newTable.shape,
      group: 'main',
      position: { x: maxX, y: 0 },
      status: 'available',
      floor: selectedFloor,
    });
    toast.success('میز جدید اضافه شد');
    setShowAddForm(false);
    setNewTable({ seats: 4, shape: 'circle' });
  }, [floorTables, newTable, selectedFloor]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-light)] to-[var(--color-surface)] relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        {/* Floor Selector */}
        <div className="flex gap-2">
          {([1, 2] as TableFloor[]).map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-200
                ${selectedFloor === floor
                  ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-accent)]/20'
                  : 'panel hover:bg-[var(--color-surface-light)] text-white'
                }
              `}
            >
              طبقه {floor}
            </button>
          ))}
        </div>

        {/* Kitchen Indicator */}
        <div className="panel px-4 py-2">
          <p className="text-sm text-[var(--color-text-secondary)]">🍳 آشپزخانه</p>
          <p className="text-xs text-[var(--color-text-muted)]">بخش پشتی</p>
        </div>
      </div>

      {/* Manager Controls */}
      {isManager && (
        <div className="absolute top-20 right-4 z-20">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
          >
            ➕ افزودن میز
          </button>
        </div>
      )}

      {/* Add Table Form */}
      {showAddForm && isManager && (
        <div className="absolute top-20 right-4 z-30 w-72">
          <div className="panel p-4 space-y-4 shadow-xl">
            <h3 className="font-bold text-white">افزودن میز جدید</h3>
            
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">تعداد صندلی</label>
              <select
                value={newTable.seats}
                onChange={(e) => setNewTable({...newTable, seats: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white"
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
                className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white"
              >
                <option value="circle">گرد</option>
                <option value="rectangle">مستطیل</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddTable}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
              >
                ✓ افزودن
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-lg"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full p-20"
        onClick={() => !isDragging && selectTable(null)}
      >
        {/* Grid Background */}
        <div 
          className="w-full h-full relative border-2 border-dashed border-[var(--color-border)] rounded-3xl overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        >
          {/* Tables - using GPU-accelerated transforms */}
          {floorTables.map((table) => (
            <TableItem
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              isDragging={dragState?.tableId === table.id}
              isManager={isManager}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onEdit={handleEditTable}
              onDelete={(id) => setTableToDelete(id)}
            />
          ))}

          {floorTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--color-text-muted)]">
                {isManager ? 'میزی نیست. روی "افزودن میز" کلیک کنید.' : 'میزی یافت نشد'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="panel p-3">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">وضعیت میزها:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-[var(--color-text-secondary)]">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="panel px-4 py-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            {isManager ? '🖱️ میزها را بکشید و جابجا کنید' : '🖱️ برای ثبت سفارش روی میز کلیک کنید'}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditForm && editTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="panel p-6 w-80 animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-4">ویرایش میز {editTable.id}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--color-text-muted)]">تعداد صندلی</label>
                <select
                  value={editTable.seats}
                  onChange={(e) => setEditTable({...editTable, seats: Number(e.target.value)})}
                  className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white"
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
                  value={editTable.shape}
                  onChange={(e) => setEditTable({...editTable, shape: e.target.value as TableShape})}
                  className="w-full mt-1 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-white"
                >
                  <option value="circle">گرد</option>
                  <option value="rectangle">مستطیل</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-medium rounded-xl"
              >
                ✓ ذخیره
              </button>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditTable(null);
                }}
                className="px-4 py-2 bg-[var(--color-surface-light)] text-white rounded-xl"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="panel p-6 w-80 text-center animate-scaleIn">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-white mb-2">حذف میز؟</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              آیا از حذف این میز اطمینان دارید؟
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTable}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl"
              >
                ✓ بله، حذف شود
              </button>
              <button
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 bg-[var(--color-surface-light)] text-white rounded-xl"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
