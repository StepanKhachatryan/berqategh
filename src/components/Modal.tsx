import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface ModalProps {
  title: string;
  subtitle?: string;
  /**
   * Leave the header bar to the close button. For sheets whose first block
   * already names the thing — repeating it two centimetres higher is not a
   * heading, it is the same words twice. The title still reaches screen
   * readers through aria-label.
   */
  hideTitle?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}

export default function Modal({
  title,
  subtitle,
  hideTitle = false,
  onClose,
  children,
  footer,
  headerExtra,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="sheet-grab" />
        <div className={`modal-header${hideTitle ? ' is-bare' : ''}`}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {hideTitle ? null : (
              <>
                <h2>{title}</h2>
                {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
              </>
            )}
          </div>
          {headerExtra}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Փակել">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </>
  );
}
