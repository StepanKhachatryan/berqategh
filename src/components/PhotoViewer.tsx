import { useEffect } from 'react';
import { IconClose } from './Icons';

interface PhotoViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * A seller's photo at full size, over everything, on black.
 *
 * Tap anywhere or press Escape to go back to the listing. Escape is caught
 * before the sheet underneath hears it, so it closes this and not both.
 */
export default function PhotoViewer({ src, alt, onClose }: PhotoViewerProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <img src={src} alt={alt} />
      <button type="button" className="photo-viewer-close" aria-label="Փակել" onClick={onClose}>
        <IconClose size={22} />
      </button>
    </div>
  );
}
