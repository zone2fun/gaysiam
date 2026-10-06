import React from 'react';
import { MessageSquare, X, CheckCircle, Bell } from 'lucide-react';
import { InAppNotification } from '../types';

interface ToastContainerProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
  onSelectGroup: (groupId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  onSelectGroup,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          onClick={() => {
            onSelectGroup(toast.groupId);
            onDismiss(toast.id);
          }}
          className="pointer-events-auto p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex items-start gap-3 cursor-pointer hover:border-indigo-500/50 transition-all animate-in slide-in-from-bottom-5"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                {toast.groupName}
              </span>
              <span className="text-[10px] text-slate-400">{toast.time}</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {toast.senderName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {toast.text}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
