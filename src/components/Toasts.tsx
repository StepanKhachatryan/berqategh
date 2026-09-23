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

  /*
   * The same message is never shown twice at once.
   *
   * A repeated failure is not more informative the fifth time, and a stack of
   * identical banners is actively harmful: a seller once filmed a form buried
   * under 78 copies of one location error, with no way to reach the fields
   * underneath. The cause of that repetition is fixed, but a toast queue that
   * can be made to bury the interface is a bad building block whatever calls
   * it, so the ceiling belongs here too.
   */
  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId.current++;

    setToasts((current) =>
      current.some((toast) => toast.text === text && toast.kind === kind)
        ? current
        : [...current, { id, kind, text }],
    );

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
