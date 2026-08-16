import type { LatLng } from './types';

/** Roughly the centre of Armenia — the map's home view before we know better. */
export const ARMENIA_CENTER: LatLng = { lat: 40.2, lng: 44.9 };

/** Bounds the map is clamped to, matching the DB's lat/lng check constraints. */
export const ARMENIA_BOUNDS: [[number, number], [number, number]] = [
  [38.5, 43.0],
  [41.5, 47.0],
];

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function isInsideArmenia({ lat, lng }: LatLng): boolean {
  const [[minLat, minLng], [maxLat, maxLng]] = ARMENIA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Road distance is always longer than the straight line, so a straight-line
 * prefilter this wide can only ever be too generous — never too tight. That
 * keeps it safe to use for trimming the candidate set before routing.
 */
export const ROAD_DETOUR_FACTOR = 1.4;

export function boundingBox(center: LatLng, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.2, Math.cos(toRad(center.lat))));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} մ`;
  if (km < 10) return `${km.toFixed(1)} կմ`;
  return `${Math.round(km)} կմ`;
}
