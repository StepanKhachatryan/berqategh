/**
 * Advertisers' logos, where one has been uploaded: a file in service-logos/
 * named by the service id is converted into src/assets/logos/ and found here at
 * build time, the same arrangement as the offering pictures.
 */
const FILES = import.meta.glob<string>('../assets/logos/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const BY_NAME = new Map<string, string>(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

export function serviceLogo(id: string): string | null {
  return BY_NAME.get(id) ?? null;
}
