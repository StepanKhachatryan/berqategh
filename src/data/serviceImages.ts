import { OFFERINGS, type OfferingId } from './services';

/**
 * Pictures for service offerings, where one exists - the same arrangement as
 * produceImages.ts. A file dropped into service-images/ (named by offering id,
 * see its README) is converted into src/assets/services/ and found here at
 * build time; every offering without one keeps its emoji.
 */
const FILES = import.meta.glob<string>('../assets/services/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const BY_NAME = new Map<string, string>(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

export function offeringImage(id: OfferingId): string | null {
  return BY_NAME.get(id) ?? null;
}

/**
 * The offering's mark as HTML, for markers built as strings: its picture,
 * sized by the surrounding font-size like an emoji, or the emoji itself.
 */
export function offeringMarkHtml(id: OfferingId): string {
  const src = offeringImage(id);
  return src ? `<img class="svc-photo" src="${src}" alt="">` : OFFERINGS[id].emoji;
}
