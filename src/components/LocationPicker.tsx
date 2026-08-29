import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ARMENIA_BOUNDS, ARMENIA_CENTER, isInsideArmenia } from '../lib/geo';
import { describePlace } from '../lib/geocode';
import { pinSvg } from './markers';
import { IconCrosshair } from './Icons';
import PlaceSearch from './PlaceSearch';
import InAppBrowserNotice from './InAppBrowserNotice';
import type { LatLng, SaleType } from '../lib/types';

interface LocationPickerProps {
  value: LatLng | null;
  /** Fires only for deliberate user gestures, never for programmatic recentring. */
  onChange: (point: LatLng) => void;
  onLocate: () => void;
  locating: boolean;
  statusMessage: string;
  statusIsError: boolean;
  saleType: SaleType;
  productColor: string;
}

/**
 * The seller's pin sits at the centre of this mini map and the map moves under
 * it. That is deliberate: on a phone, dragging a small marker with a thumb is
 * fiddly and the finger covers the exact spot being aimed at, whereas dragging
 * the map keeps the target visible the whole time.
 */
export default function LocationPicker({
  value,
  onChange,
  onLocate,
  locating,
  statusMessage,
  statusIsError,
  saleType,
  productColor,
}: LocationPickerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const changeRef = useRef(onChange);
  // Recentring the map on a fresh GPS fix also fires moveend. Without this the
  // caller could not tell an automatic move from the user dragging the map.
  const programmaticRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [place, setPlace] = useState<string | null>(null);

  changeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const start = value ?? ARMENIA_CENTER;
    const map = L.map(hostRef.current, {
      center: [start.lat, start.lng],
      zoom: value ? 15 : 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: L.latLngBounds(ARMENIA_BOUNDS).pad(0.3),
      maxBoundsViscosity: 1,
      minZoom: 7,
    });

    // Same keyless OSM tiles as the main map — CARTO now watermarks unkeyed
    // requests, which would sit right under the seller's pin.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('movestart', () => setDragging(true));
    map.on('moveend', () => {
      setDragging(false);
      if (programmaticRef.current) {
        programmaticRef.current = false;
        return;
      }
      const center = map.getCenter();
      changeRef.current({ lat: center.lat, lng: center.lng });
    });

    mapRef.current = map;
    // The container is inside a sheet that animates in; measure once settled.
    const timer = window.setTimeout(() => map.invalidateSize(), 220);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // Only ever runs once — `value` here is just the initial camera position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when the value changes from the outside (a fresh GPS fix), but not
  // while the user is mid-drag, which would fight their gesture.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value || dragging) return;

    const center = map.getCenter();
    if (Math.abs(center.lat - value.lat) < 1e-6 && Math.abs(center.lng - value.lng) < 1e-6) {
      return;
    }
    programmaticRef.current = true;
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [value, dragging]);

  useEffect(() => {
    if (!value || dragging) return;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      describePlace(value).then((label) => {
        if (!cancelled) setPlace(label);
      });
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, dragging]);

  const outsideArmenia = value !== null && !isInsideArmenia(value);

  return (
    <>
      <InAppBrowserNotice />

      {/* Always available, not just as a fallback: typing a village name is
          often faster than waiting on a GPS fix, and it is the only route that
          works at all inside an in-app browser. */}
      <PlaceSearch
        onPick={(point) => {
          setPlace(null);
          changeRef.current(point);
        }}
      />

      <div className="locate-box">
      <div className={`locate-map is-osm${dragging ? ' is-dragging' : ''}`}>
        <div ref={hostRef} style={{ height: '100%' }} />
        <div
          className="locate-crosshair"
          dangerouslySetInnerHTML={{ __html: pinSvg(saleType, productColor, 0.85) }}
        />
      </div>

      <div className="locate-bar">
        {/* The address, never the coordinates: a seller cannot tell whether
            "40.15530, 44.03670" is their field, but they know their village. */}
        <div className={`locate-status${statusIsError || outsideArmenia ? ' is-error' : ''}`}>
          <strong>
            {outsideArmenia
              ? 'Կետը Հայաստանից դուրս է'
              : (place ?? (value ? 'Նշված կետ' : 'Կետը նշված չէ'))}
          </strong>
          {outsideArmenia ? 'Շարժե՛ք քարտեզը Հայաստանի ներսում' : statusMessage}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onLocate}
          disabled={locating}
        >
          {locating ? <span className="spinner spinner-dark" /> : <IconCrosshair size={17} />}
          Իմ տեղը
        </button>
      </div>
      </div>
    </>
  );
}
