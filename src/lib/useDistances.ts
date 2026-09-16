import { useEffect, useRef, useState } from 'react';
import { roadDistances, type DistanceResult } from './routing';
import type { LatLng, Listing } from './types';

/**
 * Keeps a road distance for every listing, refreshed whenever the buyer moves
 * or the listing set changes. Results are keyed by listing id and merged in as
 * they arrive, so cards can render immediately and gain their distance a moment
 * later rather than blocking on the routing round trip.
 */
export function useDistances(origin: LatLng | null, listings: Listing[]) {
  const [distances, setDistances] = useState<Map<string, DistanceResult>>(new Map());
  const [measuring, setMeasuring] = useState(false);
  const runRef = useRef(0);

  // A stable description of "which listings, from where". Without it, every
  // poll of the listings table would kick off a fresh routing pass.
  const originKey = origin ? `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}` : '';
  const listingKey = listings
    .map((listing) => listing.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!origin || listings.length === 0) {
      setDistances(new Map());
      setMeasuring(false);
      return;
    }

    const run = ++runRef.current;
    setMeasuring(true);

    roadDistances(
      origin,
      listings.map((listing) => ({ lat: listing.lat, lng: listing.lng })),
    )
      .then((results) => {
        if (run !== runRef.current) return;
        const next = new Map<string, DistanceResult>();
        listings.forEach((listing, index) => next.set(listing.id, results[index]));
        setDistances(next);
      })
      .finally(() => {
        if (run === runRef.current) setMeasuring(false);
      });
    // `origin` and `listings` are captured through their stable keys above; the
    // identities themselves change on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, listingKey]);

  return { distances, measuring };
}
