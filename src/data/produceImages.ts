import { getProduce } from './produce';
import type { ProduceForm } from '../lib/types';

/**
 * Photographs for produce, where one exists.
 *
 * The catalogue has 97 items and Unicode has emoji for maybe a fifth of them,
 * so twenty different herbs currently share one 🌿 and a customer cannot tell
 * them apart at a glance. Real pictures fix that — but drawing or sourcing 97 of
 * them is slow, and the app must not wait for the whole set.
 *
 * So it takes whatever exists. Vite scans the folder at build time, which means
 * adding a picture is dropping a file in and rebuilding: no import to write, no
 * list to keep in sync, nothing here to edit. Everything still missing keeps its
 * emoji, and the two sit side by side without anyone noticing the seam.
 */
const FILES = import.meta.glob<string>('../assets/produce/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** file stem → hashed URL of its picture. */
const BY_NAME = new Map<string, string>(
  Object.entries(FILES).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.webp'.length),
    url,
  ]),
);

/*
 * Two of the files are not crops.
 *
 * `honey.webp` is a jar and a comb, which is every entry in the honey group:
 * flower honey and acacia honey look identical in a photograph, and nobody is
 * going to shoot five jars that differ only in the label.
 *
 * `dried.webp` is a plate of չիր, and it stands for the dried FORM rather than
 * for any one crop. A dried fig and a dried apricot are recognisably the same
 * kind of thing on a map pin, and that thing is not a fresh fig — which is what
 * the crop's own photograph would show.
 *
 * Both are fallbacks, consulted only after a crop's own file: the day somebody
 * shoots real acacia honey, `honey-acacia.webp` wins with no code change.
 */
const GROUP_PHOTO = 'honey';
const DRIED_PHOTO = 'dried';

/** Where the չիր plate is a fair likeness. Dried herbs keep their leaf. */
const DRIED_CATEGORIES = new Set(['fruit', 'berry', 'vegetable', 'tropical']);

export function produceImage(
  productId: string,
  form: ProduceForm = 'fresh',
): string | null {
  const category = getProduce(productId)?.category;

  if (form === 'dried' && category && DRIED_CATEGORIES.has(category)) {
    const dried = BY_NAME.get(DRIED_PHOTO);
    if (dried) return dried;
  }

  const own = BY_NAME.get(productId);
  if (own) return own;

  if (category === 'honey') return BY_NAME.get(GROUP_PHOTO) ?? null;

  return null;
}

/** How many of the catalogue currently have one. Used by nothing but the log. */
export const PRODUCE_IMAGE_COUNT = BY_NAME.size;
