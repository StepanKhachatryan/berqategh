import type { LatLng } from './types';

/**
 * Reverse geocoding through OSM's Nominatim, purely so the seller can sanity
 * check the pin ("Արարատի մարզ, Վեդի") before publishing. It is decorative:
 * every failure resolves to null and the form carries on with the coordinates.
 */
const NOMINATIM =
  import.meta.env.VITE_NOMINATIM_URL?.replace(/\/$/, '') ??
  'https://nominatim.openstreetmap.org';

const cache = new Map<string, string | null>();

interface NominatimAddress {
  village?: string;
  town?: string;
  city?: string;
  hamlet?: string;
  suburb?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

export async function describePlace({ lat, lng }: LatLng): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;

  const url =
    `${NOMINATIM}/reverse?format=jsonv2&zoom=13&accept-language=hy` +
    `&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);

    const body = (await response.json()) as { address?: NominatimAddress };
    const address = body.address ?? {};

    const settlement =
      address.village ?? address.town ?? address.city ?? address.hamlet ?? address.suburb;
    const region = address.state ?? address.county ?? address.municipality;

    const label = [settlement, region].filter(Boolean).join(', ') || null;
    cache.set(key, label);
    return label;
  } catch {
    cache.set(key, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
