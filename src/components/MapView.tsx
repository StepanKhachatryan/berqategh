import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { listingIcon, meIcon, pinSvg, SALE_TYPE_SHORT } from './markers';
import { ARMENIA_BOUNDS, ARMENIA_CENTER } from '../lib/geo';
import { listingTitle, type LatLng, type MeasuredListing, type SaleType } from '../lib/types';
import { IconCrosshair, IconLayers, IconClose, IconInfo, IconHelp } from './Icons';

/**
 * Two genuinely different views, not two renderings of the same one: the
 * OpenStreetMap base for streets and place names, and satellite imagery for
 * recognising the actual field or orchard a pin sits on — which is often how a
 * buyer confirms they are looking at the right place in the countryside.
 *
 * Tiles come straight from openstreetmap.org. CARTO's prettier "Voyager"
 * rendering was used until they began requiring an API key and stamping
 * unkeyed tiles with "API KEY REQUIRED" across the whole map. These need no
 * key at all. The standard OSM style is busier than Voyager, so the tile pane
 * is gently desaturated in CSS to keep the produce colours on the pins reading
 * as the loudest thing on screen.
 */
const BASEMAPS = {
  osm: {
    label: 'Քարտեզ (OSM)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    label: 'Արբանյակ',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Imagery &copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

interface MapViewProps {
  onOpenGuide: () => void;
  listings: MeasuredListing[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  origin: LatLng | null;
  radiusKm: number | null;
  onLocate: () => void;
  locating: boolean;
  /** Set to pan the map somewhere; the same value never pans twice. */
  focus: { point: LatLng; zoom?: number; nonce: number } | null;
}

export default function MapView({
  onOpenGuide,
  listings,
  selectedId,
  onSelect,
  origin,
  radiusKm,
  onLocate,
  locating,
  focus,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const ringRef = useRef<L.Circle | null>(null);
  const selectRef = useRef(onSelect);
  const seenRef = useRef(new Set<string>());

  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  // On a phone the legend would cover a third of the map, so it starts folded
  // into its button there and open on the roomier desktop layout.
  const [showLegend, setShowLegend] = useState(() => window.innerWidth >= 900);
  const fittedRef = useRef(false);

  selectRef.current = onSelect;

  // ─── map lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      center: [ARMENIA_CENTER.lat, ARMENIA_CENTER.lng],
      zoom: 8,
      zoomControl: false,
      maxBounds: L.latLngBounds(ARMENIA_BOUNDS).pad(0.4),
      maxBoundsViscosity: 0.7,
      minZoom: 7,
      preferCanvas: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    // A tap on empty map closes whatever card is open.
    map.on('click', () => selectRef.current(null));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ─── basemap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileRef.current?.remove();
    const config = BASEMAPS[basemap];
    tileRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);
  }, [basemap]);

  // ─── listing pins ────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const markers = markersRef.current;
    const live = new Set(listings.map((listing) => listing.id));

    for (const [id, marker] of markers) {
      if (!live.has(id)) {
        layer.removeLayer(marker);
        markers.delete(id);
      }
    }

    for (const listing of listings) {
      const isNew = !seenRef.current.has(listing.id);
      const icon = listingIcon({
        saleType: listing.saleType,
        productId: listing.productId,
        form: listing.form,
        selected: listing.id === selectedId,
        animate: isNew,
      });
      seenRef.current.add(listing.id);

      const existing = markers.get(listing.id);
      if (existing) {
        existing.setLatLng([listing.lat, listing.lng]);
        existing.setIcon(icon);
        continue;
      }

      const marker = L.marker([listing.lat, listing.lng], {
        icon,
        riseOnHover: true,
        keyboard: true,
        alt: `${listingTitle(listing)} — ${SALE_TYPE_SHORT[listing.saleType]}`,
      });

      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        selectRef.current(listing.id);
      });

      marker.addTo(layer);
      markers.set(listing.id, marker);
    }
  }, [listings, selectedId]);

  // ─── the buyer's own position and search radius ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!origin) {
      meRef.current?.remove();
      meRef.current = null;
      ringRef.current?.remove();
      ringRef.current = null;
      return;
    }

    const point: L.LatLngExpression = [origin.lat, origin.lng];
    if (meRef.current) meRef.current.setLatLng(point);
    else meRef.current = L.marker(point, { icon: meIcon(), interactive: false }).addTo(map);

    if (radiusKm) {
      const options = {
        radius: radiusKm * 1000,
        color: '#17a34a',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#17a34a',
        fillOpacity: 0.07,
        interactive: false,
      };
      if (ringRef.current) ringRef.current.setLatLng(point).setStyle(options).setRadius(options.radius);
      else ringRef.current = L.circle(point, options).addTo(map);
    } else {
      ringRef.current?.remove();
      ringRef.current = null;
    }
  }, [origin, radiusKm]);

  // The default Armenia-wide view leaves most pins outside the short map strip
  // a phone has room for, so the first batch of listings sets the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fittedRef.current || listings.length === 0) return;

    fittedRef.current = true;
    map.fitBounds(
      L.latLngBounds(listings.map((listing) => [listing.lat, listing.lng] as [number, number])),
      { padding: [44, 44], maxZoom: 12, animate: false },
    );
  }, [listings]);

  // ─── imperative pan requests ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo([focus.point.lat, focus.point.lng], focus.zoom ?? map.getZoom(), {
      duration: 0.7,
    });
  }, [focus]);

  // Leaflet needs a nudge whenever its container changes size.
  useEffect(() => {
    const map = mapRef.current;
    const host = hostRef.current;
    if (!map || !host || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const legendItems = useMemo(
    () => (['retail', 'wholesale', 'both'] as SaleType[]).map((type) => ({
      type,
      label: SALE_TYPE_SHORT[type],
      svg: pinSvg(type, '#9aa79c', 0.5),
    })),
    [],
  );

  return (
    <div className="map-pane">
      <div
        ref={hostRef}
        className={`map-root${basemap === 'osm' ? ' is-osm' : ''}`}
        role="application"
        aria-label="Բերքի քարտեզ"
      />

      <div className="map-floats">
        {/* Kept at the top of the stack and always on screen — the guide is
            something people need to be able to look up at any moment. */}
        <button
          type="button"
          className="map-float-btn is-guide"
          onClick={onOpenGuide}
          title="Ինչպես օգտվել"
          aria-label="Ինչպես օգտվել"
        >
          <IconHelp />
        </button>
        <button
          type="button"
          className={`map-float-btn${basemap === 'satellite' ? ' is-on' : ''}`}
          onClick={() => setBasemap((current) => (current === 'osm' ? 'satellite' : 'osm'))}
          title={`Անցնել՝ ${BASEMAPS[basemap === 'osm' ? 'satellite' : 'osm'].label}`}
          aria-label={`Անցնել՝ ${BASEMAPS[basemap === 'osm' ? 'satellite' : 'osm'].label}`}
        >
          <IconLayers />
        </button>
        <button
          type="button"
          className={`map-float-btn${origin ? ' is-on' : ''}`}
          onClick={onLocate}
          title="Գտնել իմ տեղը"
          aria-label="Գտնել իմ տեղը"
          disabled={locating}
        >
          {locating ? <span className="spinner spinner-dark" /> : <IconCrosshair />}
        </button>
      </div>

      {showLegend ? (
        <div className="map-legend">
          <h4>Նշանների բացատրություն</h4>
          <ul>
            {legendItems.map((item) => (
              <li key={item.type}>
                <span dangerouslySetInnerHTML={{ __html: item.svg }} />
                {item.label}
              </li>
            ))}
          </ul>
          <p className="legend-note">
            Գույնը ցույց է տալիս մրգի կամ բանջարեղենի տեսակը։ Չիրը՝ նույն գույնի ավելի
            մուգ երանգով։
          </p>
          <button
            type="button"
            className="icon-btn"
            style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26 }}
            onClick={() => setShowLegend(false)}
            aria-label="Փակել բացատրությունը"
          >
            <IconClose size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="map-float-btn legend-toggle"
          onClick={() => setShowLegend(true)}
          aria-label="Ցույց տալ նշանների բացատրությունը"
        >
          <IconInfo size={19} />
        </button>
      )}
    </div>
  );
}
