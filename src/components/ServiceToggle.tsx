import { IconService } from './Icons';

interface ServiceToggleProps {
  active: boolean;
  /** Breathes until the layer has been opened once. */
  unseen: boolean;
  onToggle: () => void;
  /** Where it sits: the map's corner on phones, the header on desktop. */
  className?: string;
}

/**
 * The agricultural-services switch. It carries its name — a toolbox icon on its
 * own says nothing — and a track with a knob, so it reads as pressable before
 * the first press.
 */
export default function ServiceToggle({ active, unseen, onToggle, className }: ServiceToggleProps) {
  return (
    <button
      type="button"
      className={`map-service-btn${active ? ' is-on' : ''}${unseen && !active ? ' is-unseen' : ''}${
        className ? ` ${className}` : ''
      }`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <IconService size={16} />
      <span>Գյուղատնտեսական ծառայություն</span>
      <span className="switch" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}
