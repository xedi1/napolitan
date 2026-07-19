'use client';

import { useUIStore, useAuditStore } from '@/store';
import { formatTime } from '@/lib/utils';

export function AuditPanel() {
  const { isAuditPanelOpen, toggleAuditPanel } = useUIStore();
  const { entries } = useAuditStore();

  if (!isAuditPanelOpen) return null;

  const roleLabels: Record<string, string> = {
    manager: 'مدیر',
    kitchen: 'آشپزخانه',
    waiter: 'گارسون',
  };

  return (
    <div className="fixed bottom-20 left-6 w-96 max-h-[400px] panel flex flex-col z-20">
      <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">📋 لاگ تغییرات</h3>
        <button onClick={toggleAuditPanel} className="p-2 hover:bg-[var(--bg-dark)] rounded-lg">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-8">هیچ تغییری ثبت نشده</p>
        ) : (
          entries.slice(0, 20).map(entry => (
            <div key={entry.id} className="py-3 border-b border-[var(--border-color)] last:border-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{entry.userName}</span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  entry.actionType === 'delete' ? 'bg-red-400/20 text-red-400' :
                  entry.actionType === 'discount' ? 'bg-yellow-400/20 text-yellow-400' :
                  entry.actionType === 'cancel' ? 'bg-purple-400/20 text-purple-400' :
                  'bg-[var(--accent)]/20 text-[var(--accent)]'
                }`}>
                  {entry.action}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{entry.details}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {roleLabels[entry.userRole]} - {formatTime(entry.timestamp)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
