'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

const styles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error:   'border-red-200    bg-red-50    text-red-800',
  info:    'border-blue-200   bg-blue-50   text-blue-800',
};

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md min-w-[280px] max-w-sm', styles[toast.variant])}>
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-current bg-opacity-10 text-xs font-bold">
        {icons[toast.variant]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-xs opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Global toast store (module-level singleton) ───────────────────────────────
type Listener = (toasts: ToastMessage[]) => void;
let _toasts: ToastMessage[] = [];
const _listeners = new Set<Listener>();

function notify() { _listeners.forEach((l) => l([..._toasts])); }

export function toast(variant: ToastVariant, title: string, description?: string) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  _toasts = [..._toasts, { id, variant, title, description }];
  notify();
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const l: Listener = (t) => setToasts(t);
    _listeners.add(l);
    return () => { _listeners.delete(l); };
  }, []);

  function dismiss(id: string) {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2" role="region" aria-label="Notifications">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>
  );
}
