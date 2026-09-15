import { produceEmoji } from '../data/produce';
import { produceImage } from '../data/produceImages';
import type { ProduceForm } from '../lib/types';

interface ProduceMarkProps {
  productId: string;
  form?: ProduceForm;
  /** Shown when the id matches nothing — the seller form before a pick. */
  fallback?: string;
}

/**
 * Whatever best represents a crop right now: its photograph if the catalogue has
 * one, its emoji otherwise.
 *
 * Every place a crop appears goes through here, so the set can be filled in one
 * picture at a time without touching five components each round.
 *
 * Dried fruit keeps the sun rather than the crop, photograph or not — a picture
 * of a fresh apricot on a listing for չիր would say the wrong thing.
 */
export default function ProduceMark({ productId, form = 'fresh', fallback }: ProduceMarkProps) {
  if (form === 'dried') return <span>☀️</span>;

  const src = produceImage(productId);
  if (src) {
    return <img className="produce-photo" src={src} alt="" loading="lazy" decoding="async" />;
  }

  return <span>{produceEmoji(productId) || fallback || '🧺'}</span>;
}
