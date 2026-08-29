import { haversineKm, ROAD_DETOUR_FACTOR } from './geo';
import type { DistanceMode, LatLng } from './types';

/**
 * Road distances via OSRM's table service. The buyer's radius filter is meant
 * to answer "how far do I actually have to drive", not "how far is it as the
 * crow flies", and over Armenia's mountain roads those two numbers diverge a
 * lot — a village 12 km away in a straight line can easily be a 40 km drive.
 *
 * The public demo server is best-effort, so every failure path falls back to a
 * straight line scaled by a detour factor and reports which mode was used, so
 * the UI can say so rather than quietly showing a worse number.
 */

const OSRM_BASE =
  import.meta.env.VITE_OSRM_URL?.replace(/\/$/, '') ?? 'https://router.project-osrm.org';

/** OSRM's demo table service caps the matrix; stay well under it. */
const BATCH_SIZE = 80;
const REQUEST_TIMEOUT_MS = 8000;

export interface DistanceResult {
  km: number;
  mode: DistanceMode;
}

const cache = new Map<string, DistanceResult>();

function cacheKey(origin: LatLng, target: LatLng): string {
  // ~11 m of precision: fine enough that re-locating by a few metres reuses
  // the cached matrix instead of re-hitting the routing server.
  return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${target.lat.toFixed(4)},${target.lng.toFixed(4)}`;
}

function straightLineEstimate(origin: LatLng, target: LatLng): DistanceResult {
  return { km: haversineKm(origin, target) * ROAD_DETOUR_FACTOR, mode: 'straight' };
}

function coord({ lat, lng }: LatLng): string {
  return `${lng.toFixed(6)},${lat.toFixed(6)}`;
}

async function fetchBatch(origin: LatLng, targets: LatLng[]): Promise<(number | null)[]> {
  const path = [origin, ...targets].map(coord).join(';');
  const url = `${OSRM_BASE}/table/v1/driving/${path}?sources=0&annotations=distance`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`OSRM responded ${response.status}`);

    const body = (await response.json()) as {
      code?: string;
      distances?: (number | null)[][];
    };
    if (body.code !== 'Ok' || !body.distances?.[0]) throw new Error('OSRM returned no matrix');

    // Row 0 is the origin against every coordinate; drop its self-distance.
    return body.distances[0].slice(1);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a road distance for every target, in the same order. Never rejects:
 * anything the routing server cannot answer comes back as a straight-line
 * estimate flagged as such.
 */
export async function roadDistances(
  origin: LatLng,
  targets: LatLng[],
): Promise<DistanceResult[]> {
  const results = new Array<DistanceResult | undefined>(targets.length);
  const pending: { index: number; point: LatLng }[] = [];

  targets.forEach((point, index) => {
    const hit = cache.get(cacheKey(origin, point));
    if (hit) results[index] = hit;
    else pending.push({ index, point });
  });

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);
    let metres: (number | null)[];

    try {
      metres = await fetchBatch(
        origin,
        batch.map((entry) => entry.point),
      );
    } catch {
      metres = batch.map(() => null);
    }

    batch.forEach((entry, offset) => {
      const value = metres[offset];
      const result: DistanceResult =
        typeof value === 'number' && Number.isFinite(value)
          ? { km: value / 1000, mode: 'road' }
          : straightLineEstimate(origin, entry.point);

      // Only road answers are worth keeping — a fallback should get another
      // chance at the real thing on the next pass.
      if (result.mode === 'road') cache.set(cacheKey(origin, entry.point), result);
      results[entry.index] = result;
    });
  }

  return results.map((result, index) => result ?? straightLineEstimate(origin, targets[index]));
}
