'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTableStore, useUIStore, useOrderStore, useAuthStore } from '@/store';
import { getStatusLabel } from '@/lib/utils';
import type { Table, TableShape, TableStatus, TableFloor } from '@/types';
import { toast } from 'sonner';

const STATUS_COLORS: Record<TableStatus, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  preparing: 'bg-orange-500',
  awaiting: 'bg-yellow-500',
  eating: 'bg-blue-500',
  reserved: 'bg-purple-500',
  cleaning: 'bg-cyan-500',
};

interface DragState {
  tableId: number;
  offsetX: number;
  offsetY: number;
}

interface AddTableForm {
  seats: number;
  shape: TableShape;
}

/**
 * FloorMap - Drag & drop table arrangement for cafe floor plan
 * Allows managers to add, edit, delete, and reposition tables
 */
export default function FloorMap() {
  const { tables, selectTable, selectedTableId, addTable, updateTable, removeTable } = useTableStore();
  const { selectedFloor, setSelectedFloor } = useUIStore();
  const { setCurrentOrder } = useOrderStore();
  const { currentUser } = useAuthStore();

  const mapRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState<AddTableForm>({ seats: 4, shape: 'circle' });
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);

  const isManager = currentUser?.role === 'manager';
  const floorTables = tables.filter((t) => t.floor === selectedFloor);

  // Handle mouse down on table
  const handleTableMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    if (!isManager) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragState({
      tableId: table.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, [isManager]);

  // Handle mouse move
  useEffect(() => {
    if (!dragState || !mapRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const mapRect = mapRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - mapRect.left - dragState.offsetX, mapRect.width - 80));
      const y = Math.max(0, Math.min(e.clientY - mapRect.top - dragState.offsetY, mapRect.height - 80));
      
      // Update table position in store
      const gridX = Math.round(x / 50);
      const gridY = Math.round(y / 50);
      
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

  // Handle table click (select for ordering)
  const handleTableClick = (tableId: number) => {
    if (isDragging) return;
    selectTable(tableId);
    setCurrentOrder(null);
  };

  // Handle edit button
  const handleEditTable = (table: Table) => {
    setEditTable({ ...table });
    setShowEditForm(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editTable) return;
    updateTable(editTable.id, {
      seats: editTable.seats,
      shape: editTable.shape,
    });
    toast.success('میز ویرایش شد');
    setShowEditForm(false);
    setEditTable(null);
  };

  // Handle delete table
  const handleDeleteTable = () => {
    if (!tableToDelete) return;
    removeTable(tableToDelete);
    toast.success('میز حذف شد');
    setTableToDelete(null);
    selectTable(null);
  };

  // Handle add new table
  const handleAddTable = () => {
    const maxId = Math.max(...tables.map(t => t.id), 0);
    const maxX = Math.max(...floorTables.map(t => t.position.x), -1) + 1;
    
    addTable({
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
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-light)] relative overflow-hidden">
      {/* Header with Floor Selector */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        {/* Floor Selector */}
        <div className="flex gap-2">
          {([1, 2] as TableFloor[]).map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedFloor === floor
                  ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]'
                  : 'panel hover:bg-[var(--color-surface-light)] text-white'
              }`}
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
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            ➕ افزودن میز
          </button>
        </div>
      )}

      {/* Add Table Form */}
      {showAddForm && isManager && (
        <div className="absolute top-20 right-4 z-30 w-64">
          <div className="panel p-4 space-y-4">
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
        className="w-full h-full p-16 cursor-crosshair"
        onClick={() => !isDragging && selectTable(null)}
      >
        {/* Grid Background */}
        <div 
          className="w-full h-full relative border-2 border-dashed border-[var(--color-border)] rounded-2xl"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        >
          {/* Tables */}
          {floorTables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const isDraggingThis = dragState?.tableId === table.id;
            
            return (
              <div
                key={table.id}
                className={`
                  absolute cursor-pointer transition-all duration-150
                  ${isDraggingThis ? 'z-50 scale-110' : 'z-10'}
                  ${isSelected ? 'ring-4 ring-[var(--color-accent)]' : ''}
                `}
                style={{
                  left: `${table.position.x * 50}px`,
                  top: `${table.position.y * 50}px`,
                }}
                onMouseDown={(e) => handleTableMouseDown(e, table)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTableClick(table.id);
                }}
              >
                <div
                  className={`
                    relative flex items-center justify-center
                    ${table.shape === 'circle' ? 'rounded-full w-20 h-20' : 'rounded-2xl w-24 h-16'}
                    ${STATUS_COLORS[table.status]} bg-opacity-30 border-2 border-white/30
                    hover:bg-opacity-40 transition-all
                    ${isManager ? 'cursor-move' : ''}
                  `}
                >
                  <div className="text-center">
                    <span className="text-xl font-bold text-white block">{table.id}</span>
                    <span className="text-xs text-white/70">{table.seats} نفر</span>
                  </div>
                  
                  {/* Status Dot */}
                  <div className={`
                    absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--color-surface)]
                    ${STATUS_COLORS[table.status]}
                    ${table.status !== 'available' ? 'animate-pulse' : ''}
                  `} />
                </div>

                {/* Edit/Delete Buttons (Manager Only) */}
                {isSelected && isManager && (
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTable(table);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableToDelete(table.id);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {floorTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--color-text-muted)]">
                {isManager ? 'میزی نیست. روی "افزودن میز" کلیک کنید.' : 'میزی یافت نشد'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Table Modal */}
      {showEditForm && editTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="panel p-6 w-80">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="panel p-6 w-80 text-center">
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

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="panel p-3">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">وضعیت میزها:</p>
          <div className="space-y-1">
            {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
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
    </div>
  );
}
