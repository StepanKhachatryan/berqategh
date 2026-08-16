import { isInsideArmenia } from './geo';
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

export interface PlaceResult {
  label: string;
  detail: string;
  point: LatLng;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  addresstype?: string;
}

/**
 * Finds a place in Armenia by name — the way to set a location when the
 * Geolocation API is unavailable, which is the normal state of affairs inside
 * Messenger and other in-app browsers. A farmer always knows the name of their
 * village even when the browser cannot be told where the phone is.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url =
    `${NOMINATIM}/search?format=jsonv2&countrycodes=am&accept-language=hy` +
    `&limit=8&q=${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);

    const body = (await response.json()) as NominatimSearchResult[];

    return body
      .map((entry) => {
        const point = { lat: Number(entry.lat), lng: Number(entry.lon) };
        const full = (entry.display_name ?? '')
          .split(',')
          .map((part) => part.trim())
          // The country and postcode add nothing when every result is Armenian.
          .filter((part) => part && part !== 'Հայաստան' && part !== 'Armenia' && !/^\d{4}$/.test(part));

        return {
          label: entry.name || full[0] || trimmed,
          detail: full.slice(1, 4).join(', '),
          point,
        };
      })
      .filter((result) => Number.isFinite(result.point.lat) && isInsideArmenia(result.point));
  } catch {
    // Includes the AbortError fired when the user keeps typing.
    return [];
  }
}
