import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = Date.now().toString() + '_' + Math.floor(Date.now() % 1000);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4"
        aria-live="polite"
        role="region"
        aria-label="System notifications"
      >
        {toasts.map((toast) => {
          const bgMap = {
            success: 'bg-panel dark:bg-panel-dark border-state-normal text-ink dark:text-ink-inverse',
            warning: 'bg-panel dark:bg-panel-dark border-state-warning text-ink dark:text-ink-inverse',
            error: 'bg-panel dark:bg-panel-dark border-state-critical text-ink dark:text-ink-inverse',
            info: 'bg-panel dark:bg-panel-dark border-aerospace text-ink dark:text-ink-inverse',
          };
          const iconMap = {
            success: <CheckCircle2 className="w-4 h-4 text-state-normal flex-shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-state-warning flex-shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-state-critical flex-shrink-0" />,
            info: <Info className="w-4 h-4 text-aerospace flex-shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3 rounded-lg border shadow-lg flex items-start gap-3 transition-all transform translate-y-0 ${bgMap[toast.type]}`}
            >
              {iconMap[toast.type]}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-tight">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] text-ink-secondary dark:text-ink-muted mt-0.5 leading-snug break-words">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-ink-muted hover:text-ink dark:hover:text-ink-inverse transition-colors p-1"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
