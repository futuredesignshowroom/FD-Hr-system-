"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info'; duration?: number };

const ToastContext = createContext<{ show: (msg: string, opts?: Partial<Toast>) => void } | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, opts?: Partial<Toast>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 9);
    const toast: Toast = { id, message, type: opts?.type || 'info', duration: opts?.duration ?? 4000 };
    setToasts((s) => [...s, toast]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), toast.duration);
    }
  }, []);

  const remove = useCallback((id: string) => setToasts((s) => s.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-xs w-[320px] rounded shadow p-3 text-sm flex items-start justify-between border ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="mr-3">{t.message}</div>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-gray-600 hover:text-gray-900">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
