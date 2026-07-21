'use client';

import { useUIStore, useAuditStore } from '@/store';
import { formatRelativeTime } from '@/lib/utils';

export function AuditPanel() {
  const { isAuditPanelOpen, toggleAuditPanel } = useUIStore();
  const { entries } = useAuditStore();

  if (!isAuditPanelOpen) return null;

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'delete': return 'bg-red-400/20 text-red-400';
      case 'discount': return 'bg-yellow-400/20 text-yellow-400';
      case 'cancel': return 'bg-purple-400/20 text-purple-400';
      case 'login': case 'logout': return 'bg-blue-400/20 text-blue-400';
      default: return 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]';
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 max-h-[400px] panel flex flex-col z-20 animate-slideUp">
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          📋 لاگ تغییرات
        </h3>
        <button onClick={toggleAuditPanel} className="p-2 hover:bg-[var(--color-surface-light)] rounded-lg transition-colors">
          ✕
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-8">هیچ تغییری ثبت نشده</p>
        ) : (
          entries.slice(0, 20).map((entry) => (
            <div key={entry.id} className="py-3 border-b border-[var(--color-border)] last:border-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-white">{entry.userName}</span>
                <span className={`px-2 py-0.5 text-xs rounded ${getActionColor(entry.actionType)}`}>
                  {entry.action}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{entry.details}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {entry.userRole === 'manager' ? 'مدیر' : entry.userRole === 'kitchen' ? 'آشپزخانه' : 'گارسون'} • {formatRelativeTime(entry.timestamp)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
