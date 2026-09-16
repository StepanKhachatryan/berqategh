import { useEffect, useState } from 'react';
import { describePlace } from './geocode';
import type { LatLng } from './types';

export type PlaceNameState =
  | { status: 'loading'; label: null }
  | { status: 'done'; label: string | null };

/**
 * Resolves a human-readable Armenian address for a point. Callers render the
 * address when it arrives and drop the row entirely when it does not — a
 * failed lookup should leave no trace, not fall back to raw coordinates.
 */
export function usePlaceName(point: LatLng | null): PlaceNameState {
  const [state, setState] = useState<PlaceNameState>({ status: 'loading', label: null });

  const key = point ? `${point.lat.toFixed(4)},${point.lng.toFixed(4)}` : '';

  useEffect(() => {
    if (!point) {
      setState({ status: 'done', label: null });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading', label: null });

    describePlace(point).then((label) => {
      if (!cancelled) setState({ status: 'done', label });
    });

    return () => {
      cancelled = true;
    };
    // `point` is captured through its rounded key; its identity changes each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
