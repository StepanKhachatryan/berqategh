import { useCallback, useEffect, useRef, useState } from 'react';
import { IconCheck, IconWarn } from './Icons';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, text }]);
    const timer = window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      kind === 'error' ? 6000 : 3600,
    );
    timers.current.push(timer);
  }, []);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.kind}`}>
          {toast.kind === 'error' ? <IconWarn /> : <IconCheck />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
