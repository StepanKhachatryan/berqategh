/**
 * Armenia's national outline, as [lng, lat] pairs in one flat array.
 *
 * Same geometry the database enforces (see the service_area table in
 * supabase/migrations): OpenStreetMap's boundary, simplified to about 1.3 km.
 * Having it here too means a seller is told their pin is outside the country
 * while they can still fix it, instead of getting a database error at publish.
 *
 * A bounding box cannot do this job — the rectangle around Armenia also covers
 * parts of Iran, Turkey, Azerbaijan and Georgia, which is exactly how a listing
 * once ended up pinned inside Iran.
 */
const RING: readonly number[] = [
  44.816, 41.297, 44.821, 41.238, 44.902, 41.221, 44.901, 41.202, 44.798, 41.222, 44.727, 41.201,
  44.677, 41.233, 44.609, 41.231, 44.594, 41.191, 44.544, 41.192, 44.532, 41.219, 44.474, 41.182,
  44.357, 41.229, 44.339, 41.200, 44.180, 41.248, 44.190, 41.229, 44.171, 41.199, 44.090, 41.200,
  43.835, 41.153, 43.749, 41.111, 43.562, 41.147, 43.460, 41.120, 43.447, 41.100, 43.470, 41.029,
  43.591, 40.989, 43.682, 40.930, 43.679, 40.847, 43.706, 40.828, 43.749, 40.732, 43.750, 40.673,
  43.727, 40.663, 43.635, 40.523, 43.568, 40.496, 43.555, 40.471, 43.620, 40.422, 43.594, 40.352,
  43.683, 40.246, 43.683, 40.228, 43.658, 40.223, 43.712, 40.176, 43.716, 40.161, 43.668, 40.153,
  43.653, 40.130, 43.665, 40.105, 43.768, 40.088, 43.895, 40.026, 44.252, 40.052, 44.420, 40.002,
  44.556, 39.902, 44.603, 39.830, 44.694, 39.790, 44.683, 39.776, 44.709, 39.772, 44.749, 39.716,
  44.881, 39.745, 44.946, 39.728, 45.000, 39.746, 45.047, 39.795, 45.066, 39.790, 45.136, 39.748,
  45.187, 39.680, 45.174, 39.588, 45.221, 39.585, 45.229, 39.607, 45.265, 39.615, 45.316, 39.609,
  45.297, 39.586, 45.341, 39.557, 45.341, 39.539, 45.387, 39.541, 45.482, 39.497, 45.530, 39.549,
  45.559, 39.542, 45.586, 39.570, 45.623, 39.565, 45.691, 39.605, 45.777, 39.578, 45.806, 39.560,
  45.816, 39.480, 45.846, 39.458, 45.799, 39.421, 45.790, 39.381, 46.001, 39.296, 45.986, 39.213,
  46.016, 39.161, 45.993, 39.152, 46.030, 39.128, 46.020, 39.110, 46.037, 39.095, 46.073, 39.081,
  46.075, 39.033, 46.101, 39.021, 46.114, 38.957, 46.152, 38.910, 46.140, 38.845, 46.185, 38.842,
  46.333, 38.924, 46.420, 38.886, 46.457, 38.901, 46.523, 38.889, 46.534, 38.868, 46.537, 38.904,
  46.508, 38.944, 46.545, 39.057, 46.513, 39.061, 46.528, 39.087, 46.490, 39.120, 46.486, 39.152,
  46.463, 39.146, 46.421, 39.191, 46.531, 39.194, 46.539, 39.160, 46.570, 39.216, 46.633, 39.230,
  46.548, 39.252, 46.498, 39.342, 46.439, 39.343, 46.382, 39.412, 46.387, 39.455, 46.454, 39.449,
  46.479, 39.480, 46.539, 39.474, 46.500, 39.514, 46.563, 39.543, 46.590, 39.529, 46.579, 39.556,
  46.522, 39.578, 46.436, 39.568, 46.419, 39.577, 46.419, 39.619, 46.362, 39.637, 46.181, 39.578,
  46.152, 39.649, 46.099, 39.687, 46.057, 39.692, 46.071, 39.704, 45.970, 39.792, 45.832, 39.823,
  45.790, 39.898, 45.801, 39.939, 45.615, 39.976, 45.603, 40.008, 45.681, 40.034, 45.792, 40.023,
  45.839, 39.992, 45.883, 40.017, 45.901, 40.100, 45.963, 40.123, 45.979, 40.197, 45.939, 40.255,
  45.963, 40.268, 45.948, 40.283, 45.647, 40.378, 45.647, 40.394, 45.542, 40.440, 45.446, 40.517,
  45.435, 40.544, 45.455, 40.544, 45.444, 40.562, 45.460, 40.583, 45.391, 40.619, 45.372, 40.656,
  45.379, 40.699, 45.409, 40.710, 45.423, 40.738, 45.563, 40.787, 45.607, 40.844, 45.603, 40.884,
  45.567, 40.884, 45.486, 40.929, 45.461, 40.968, 45.423, 40.965, 45.419, 40.989, 45.449, 41.013,
  45.397, 41.025, 45.358, 40.999, 45.316, 41.005, 45.283, 41.038, 45.258, 41.012, 45.128, 41.095,
  45.110, 41.051, 45.071, 41.059, 45.096, 41.117, 45.183, 41.114, 45.207, 41.139, 45.203, 41.164,
  45.128, 41.208, 45.030, 41.199, 45.071, 41.250, 45.015, 41.297, 44.920, 41.259, 44.816, 41.297,
];

/** Matches the ~1.1 km outward buffer the database applies to the same ring. */
const EDGE_TOLERANCE_DEG = 0.015;

function isInsideRing(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = RING.length - 2; i < RING.length; j = i, i += 2) {
    const xi = RING[i];
    const yi = RING[i + 1];
    const xj = RING[j];
    const yj = RING[j + 1];

    const straddles = yi > lat !== yj > lat;
    if (straddles && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Shortest distance from the point to the outline, in degrees. */
function distanceToRingDeg(lat: number, lng: number): number {
  let best = Infinity;

  for (let i = 0, j = RING.length - 2; i < RING.length; j = i, i += 2) {
    const x1 = RING[j];
    const y1 = RING[j + 1];
    const x2 = RING[i];
    const y2 = RING[i + 1];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    const t =
      lengthSq === 0
        ? 0
        : Math.max(0, Math.min(1, ((lng - x1) * dx + (lat - y1) * dy) / lengthSq));

    const px = x1 + t * dx;
    const py = y1 + t * dy;
    best = Math.min(best, Math.hypot(lng - px, lat - py));
  }

  return best;
}

/**
 * Whether a point may be published. Deliberately forgiving near the border: a
 * village wrongly rejected costs a real seller, while a pin a kilometre past
 * the line costs nothing. It is the gross errors this needs to catch.
 */
export function isInsideArmenia({ lat, lng }: { lat: number; lng: number }): boolean {
  if (isInsideRing(lat, lng)) return true;
  return distanceToRingDeg(lat, lng) <= EDGE_TOLERANCE_DEG;
}
