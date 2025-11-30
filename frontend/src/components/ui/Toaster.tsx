/**
 * Toaster — Brutalist toast notification system
 *
 * Toast notifications with hard edges and brutalist styling.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Card, Stack, Text, Tick, Cross, Bang } from '../../primitives';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4" style={{ zIndex: 'var(--z-toast)' }}>
        <Stack gap={2}>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </Stack>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const iconColors = {
    success: 'text-success',
    error: 'text-accent',
    info: 'text-muted',
    warning: 'text-muted',
  };

  const borderClasses = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning',
  };

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Tick size="md" className={iconColors[toast.type]} />;
      case 'error':
        return <Cross size="md" className={iconColors[toast.type]} />;
      case 'warning':
        return <Bang size="md" className={iconColors[toast.type]} />;
      default:
        return <Bang size="md" className={iconColors[toast.type]} />;
    }
  };

  return (
    <Card
      variant="elevated"
      padding={3}
      className={`${borderClasses[toast.type]}`}
      style={{ minWidth: '288px', maxWidth: '400px' }}
    >
      <Stack direction="row" gap={3} align="start">
        {renderIcon()}
        <Stack gap={1} className="flex-1 min-w-0">
          <Text bold variant="body-sm">{toast.title}</Text>
          {toast.description && (
            <Text variant="caption" color="muted">{toast.description}</Text>
          )}
        </Stack>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-muted hover:text-primary transition-colors"
          style={{ padding: '4px' }}
        >
          <Cross size="sm" />
        </button>
      </Stack>
    </Card>
  );
};

export const Toaster: React.FC = () => {
  return null;
};
