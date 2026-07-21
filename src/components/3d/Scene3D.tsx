'use client';

import { useTableStore, useUIStore, useOrderStore } from '@/store';
import { getStatusLabel } from '@/lib/utils';

const STATUS_COLORS = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  preparing: 'bg-orange-500',
  awaiting: 'bg-yellow-500',
  eating: 'bg-blue-500',
  reserved: 'bg-purple-500',
  cleaning: 'bg-cyan-500',
};

export default function Scene3D() {
  const { tables, selectTable, selectedTableId } = useTableStore();
  const { selectedFloor } = useUIStore();
  const { setCurrentOrder } = useOrderStore();

  const floorTables = tables.filter((t) => t.floor === selectedFloor);

  const handleTableClick = (tableId: number) => {
    selectTable(tableId);
    setCurrentOrder(null);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-light)] relative overflow-hidden">
      {/* Floor Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Header Info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="panel px-4 py-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            طبقه <span className="font-bold text-white">{selectedFloor}</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {floorTables.length} میز
          </p>
        </div>
      </div>

      {/* Kitchen/Bar Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="panel px-4 py-2">
          <p className="text-sm text-[var(--color-text-secondary)]">🍳 آشپزخانه</p>
          <p className="text-xs text-[var(--color-text-muted)]">بخش پشتی</p>
        </div>
      </div>

      {/* Tables Container */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="relative w-full max-w-4xl aspect-[16/10]">
          {/* Tables */}
          {floorTables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--color-text-muted)]">میزی یافت نشد</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8 w-full h-full items-center justify-center">
              {floorTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table.id)}
                  className={`
                    relative p-6 rounded-3xl transition-all duration-300
                    ${selectedTableId === table.id
                      ? 'ring-4 ring-[var(--color-accent)] scale-105'
                      : 'hover:scale-105'
                    }
                    ${table.shape === 'circle'
                      ? 'rounded-full aspect-square'
                      : 'aspect-[4/3]'
                    }
                    ${STATUS_COLORS[table.status]} bg-opacity-20 border-2 border-opacity-50
                    hover:bg-opacity-30
                  `}
                  style={{
                    borderColor: `var(--color-${table.status === 'available' ? 'available' : table.status === 'occupied' ? 'occupied' : 'preparing'})`,
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white mb-1">
                      {table.id}
                    </span>
                    <span className="text-xs text-white/70">
                      {table.seats} نفره
                    </span>
                    <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${STATUS_COLORS[table.status]} border-2 border-[var(--color-surface)] ${table.status !== 'available' ? 'animate-pulse' : ''}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3D Placeholder Message */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="panel px-4 py-2 flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">🖱️</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            برای مشاهده سه‌بعدی، روی میز کلیک کنید
          </span>
        </div>
      </div>

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
    </div>
  );
}
