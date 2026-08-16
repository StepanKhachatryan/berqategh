import type { LatLng } from './types';

/**
 * Reverse geocoding through OSM's Nominatim, asking for Armenian names.
 *
 * Coordinates tell a buyer nothing — "40.15530, 44.03670" is not somewhere you
 * can picture or describe over the phone. An address is, so every place the app
 * would otherwise print numbers asks for a name instead and simply shows
 * nothing when one cannot be found.
 */
const NOMINATIM =
  import.meta.env.VITE_NOMINATIM_URL?.replace(/\/$/, '') ??
  'https://nominatim.openstreetmap.org';

const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

/** "Երկրորդ փողոց 14, Վեդի, Արարատի մարզ" — as much as Nominatim knows. */
function buildLabel(address: NominatimAddress): string | null {
  const street = [address.road, address.house_number].filter(Boolean).join(' ');
  const settlement =
    address.village ??
    address.town ??
    address.city ??
    address.hamlet ??
    address.suburb ??
    address.neighbourhood;
  const region = address.state ?? address.county ?? address.municipality;

  const parts: string[] = [];
  for (const part of [street, settlement, region]) {
    // Rural addresses often repeat the name across levels ("Վեդի, Վեդի").
    if (part && part !== parts[parts.length - 1]) parts.push(part);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

export async function describePlace({ lat, lng }: LatLng): Promise<string | null> {
  // ~11 m of precision, so two listings at the same stall share one lookup.
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key)!;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const url =
    `${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=hy` +
    `&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`;

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);

      const body = (await response.json()) as { address?: NominatimAddress };
      const label = buildLabel(body.address ?? {});
      cache.set(key, label);
      return label;
    } catch {
      // Not worth retrying inline: the caller renders nothing and the next
      // listing opened from the same spot will try again.
      return null;
    } finally {
      clearTimeout(timer);
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}
