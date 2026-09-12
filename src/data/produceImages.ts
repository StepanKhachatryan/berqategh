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

/** produce id → hashed URL of its picture. */
const BY_ID = new Map<string, string>(
  Object.entries(FILES).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.webp'.length),
    url,
  ]),
);

export function produceImage(productId: string): string | null {
  return BY_ID.get(productId) ?? null;
}

/** How many of the catalogue currently have one. Used by nothing but the log. */
export const PRODUCE_IMAGE_COUNT = BY_ID.size;
