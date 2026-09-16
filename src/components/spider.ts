import L from 'leaflet';

/**
 * Pins that land on the same spot, and how to pull them apart.
 *
 * Two farmers in the same village, or one farmer publishing twice, put markers
 * within a few pixels of each other — and on a phone the one underneath cannot
 * be reached at all. There is no gap to aim a finger at.
 *
 * So a tap on a stack opens it: the pins lift off the point and spread into a
 * fan above it, each on a thread back to where it really is, and the second tap
 * picks one. Nothing about the data moves; this is entirely about fingers.
 */

/**
 * How close two pins have to be, on screen, to be unpickable. A fingertip is
 * about 40px across and a pin is 42px wide, so anything inside 26px of another
 * is effectively hiding it.
 */
const OVERLAP_PX = 26;

/** Pins nearer than this to the tapped one, and to each other, in a chain. */
export function overlapGroup<T extends { id: string; lat: number; lng: number }>(
  map: L.Map,
  items: T[],
  clickedId: string,
): T[] {
  const points = new Map<string, L.Point>();
  for (const item of items) {
    points.set(item.id, map.latLngToContainerPoint([item.lat, item.lng]));
  }

  const start = points.get(clickedId);
  if (!start) return [];

  // Chained rather than "within range of the tapped one", so a line of pins
  // each overlapping its neighbour opens as the one stack it looks like.
  const group = new Map<string, T>();
  const queue = [clickedId];
  group.set(clickedId, items.find((item) => item.id === clickedId)!);

  while (queue.length > 0) {
    const currentId = queue.pop()!;
    const current = points.get(currentId)!;

    for (const item of items) {
      if (group.has(item.id)) continue;
      if (current.distanceTo(points.get(item.id)!) > OVERLAP_PX) continue;
      group.set(item.id, item);
      queue.push(item.id);
    }
  }

  return [...group.values()];
}

/**
 * Where each pin of a stack sits once it has opened, as a pixel offset from the
 * point they all share.
 *
 * An arc above the point, because that is where a hand holding a phone is not.
 * The radius comes from the spacing rather than being chosen: whatever distance
 * puts a pin's width between neighbours at this angle is the radius, so five
 * pins are as easy to hit as two.
 */
export function fanOffsets(count: number): L.Point[] {
  if (count < 2) return [new L.Point(0, 0)];

  const spread = Math.min(Math.max(60, 34 * (count - 1)), 220);
  const step = ((spread / (count - 1)) * Math.PI) / 180;
  const radius = Math.max(58, Math.min(24 / Math.sin(step / 2), 150));

  return Array.from({ length: count }, (_, i) => {
    // Measured from straight up, so the middle of the fan is directly above.
    const angle = ((-spread / 2 + (spread / (count - 1)) * i) * Math.PI) / 180;
    return new L.Point(
      Math.round(radius * Math.sin(angle)),
      Math.round(-radius * Math.cos(angle)),
    );
  });
}
