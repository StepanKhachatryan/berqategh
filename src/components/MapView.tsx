import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { listingIcon, meIcon, serviceIcon, SALE_TYPE_SHORT } from './markers';
import { fanOffsets, overlapGroup } from './spider';
import { ARMENIA_BOUNDS, ARMENIA_CENTER } from '../lib/geo';
import { listingTitle, type LatLng, type MeasuredListing } from '../lib/types';
import { IconCrosshair, IconLayers, IconHelp, IconService } from './Icons';
import { SERVICE_LABELS, type AgriService } from '../data/services';

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
/** Breathing room between the outermost pin and the edge of what is visible. */
const EDGE = 26;

/**
 * The right edge is not free map: the zoom buttons sit at the top of it and the
 * guide, layers and locate buttons at the bottom, so a pin in the far east of
 * the country lands underneath one of them.
 */
const CONTROL_COLUMN = 58;

/**
 * A pin is drawn from its point upwards, so the shape reaches well above the
 * coordinate it marks and half its width to either side. Leaflet fits the
 * coordinates, not the shapes, and the difference is the whole marker — enough
 * to push the northernmost pin off the top of the screen.
 */
const PIN_UP = 53;
const PIN_SIDE = 21;

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
  /** Pixels of map hidden behind the results pane, 0 when nothing covers it. */
  bottomInset: number;
  /**
   * The agricultural-services layer. Null on the buyer side, where the control
   * does not exist at all — a buyer looking for apricots has no use for a
   * pesticide shop, and the map is worse for carrying both.
   */
  services: ServicesLayer | null;
}

export interface ServicesLayer {
  items: AgriService[];
  active: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The control draws attention to itself until it has been used once. */
  unseen: boolean;
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
  bottomInset,
  services,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const layerRef = useRef<L.LayerGroup | null>(null);
  const serviceLayerRef = useRef<L.LayerGroup | null>(null);
  const serviceMarkersRef = useRef(new Map<string, L.Marker>());
  const selectServiceRef = useRef<(id: string | null) => void>(() => undefined);
  // Where the map was before the services layer took over, so leaving it puts
  // the seller back where they were rather than somewhere across the country.
  const beforeServicesRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const ringRef = useRef<L.Circle | null>(null);
  const selectRef = useRef(onSelect);
  const seenRef = useRef(new Set<string>());
  // Current listings, reachable from a marker's click handler without closing
  // over whatever the array happened to be when the marker was made.
  const listingsRef = useRef(listings);
  // The stack currently opened into a fan, and the threads drawn back to it.
  const fanRef = useRef<{ ids: string[]; lines: L.LayerGroup } | null>(null);
  // The map is built once, before collapseFan exists; this is how its click
  // handler reaches the current one instead of the one from mount.
  const collapseFanRef = useRef<() => void>(() => undefined);
  // Read inside the fan, which is built outside the render that knows it.
  const bottomInsetRef = useRef(0);

  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const fittedRef = useRef(false);
  const fittedInsetRef = useRef(0);

  selectRef.current = onSelect;
  listingsRef.current = listings;
  bottomInsetRef.current = bottomInset;
  if (services) selectServiceRef.current = services.onSelect;

  // ─── map lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      center: [ARMENIA_CENTER.lat, ARMENIA_CENTER.lng],
      zoom: 8,
      zoomControl: false,
      // Generous on purpose. This is a guard against panning to another
      // continent, not a frame: padded tightly it came out smaller than a tall
      // phone's viewport, and Leaflet responds to that by pinning the map to
      // the middle of it — which silently undid the offset that keeps the pins
      // clear of the results pane.
      maxBounds: L.latLngBounds(ARMENIA_BOUNDS).pad(1.1),
      maxBoundsViscosity: 0.7,
      minZoom: 7,
      // Continuous zoom rather than whole steps. Fitting the pins into a band
      // that is much wider than it is tall lands between two integer levels
      // almost every time, and rounding down threw away up to half the scale —
      // which is what made the map look stuck one step too far out.
      zoomSnap: 0,
      preferCanvas: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    // Services get a pane of their own, above the markers. It is what lets the
    // produce pins be dimmed as a group without dimming the services drawn on
    // top of them — one CSS filter on one pane, and nothing else touched.
    const servicePane = map.createPane('services');
    servicePane.style.zIndex = '620';
    serviceLayerRef.current = L.layerGroup();

    // A tap on empty map closes whatever card is open, and any opened stack.
    map.on('click', () => {
      collapseFanRef.current();
      selectRef.current(null);
    });

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

  /*
   * Opening and closing a stack of pins that share a spot.
   *
   * Imperative on purpose. The pins move in screen space, not in the data, and
   * routing that through a render would mean the map's own state and React's
   * disagreeing about where a marker is for a frame at a time.
   */
  const collapseFan = useCallback(() => {
    const map = mapRef.current;
    const fan = fanRef.current;
    if (!map || !fan) return;

    for (const id of fan.ids) {
      const listing = listingsRef.current.find((item) => item.id === id);
      const marker = markersRef.current.get(id);
      if (!listing || !marker) continue;
      marker.setLatLng([listing.lat, listing.lng]);
      marker.setZIndexOffset(0);
    }

    map.removeLayer(fan.lines);
    fanRef.current = null;
  }, []);

  collapseFanRef.current = collapseFan;

  const openFan = useCallback((group: MeasuredListing[], anchor: MeasuredListing) => {
    const map = mapRef.current;
    if (!map) return;

    const origin = map.latLngToContainerPoint([anchor.lat, anchor.lng]);
    const offsets = fanOffsets(group.length);
    const lines = L.layerGroup();

    // The true location, still marked, because every pin above it has left.
    L.circleMarker([anchor.lat, anchor.lng], {
      radius: 4,
      color: '#10251a',
      weight: 2,
      fillColor: '#fff',
      fillOpacity: 1,
      interactive: false,
    }).addTo(lines);

    group.forEach((listing, i) => {
      const marker = markersRef.current.get(listing.id);
      if (!marker) return;

      const target = map.containerPointToLatLng(origin.add(offsets[i]));
      marker.setLatLng(target);
      // Above every other pin, including the ones this stack was hiding under.
      marker.setZIndexOffset(1000);

      L.polyline([[anchor.lat, anchor.lng], [target.lat, target.lng]], {
        color: '#10251a',
        weight: 1.5,
        opacity: 0.45,
        interactive: false,
      }).addTo(lines);
    });

    lines.addTo(map);
    fanRef.current = { ids: group.map((listing) => listing.id), lines };

    /*
     * A stack near an edge opens partly off it. Nudge the map so the whole fan
     * is reachable, using the same reserved strips as the opening frame: the
     * results pane below, the button column on the right.
     */
    const size = map.getSize();
    const covered = window.innerWidth < 900 ? bottomInsetRef.current : 0;
    const points = offsets.map((offset) => origin.add(offset));

    const left = Math.min(...points.map((point) => point.x)) - PIN_SIDE;
    const right = Math.max(...points.map((point) => point.x)) + PIN_SIDE;
    const top = Math.min(...points.map((point) => point.y)) - PIN_UP;
    const bottom = Math.max(...points.map((point) => point.y));

    let dx = 0;
    if (left < EDGE) dx = left - EDGE;
    else if (right > size.x - CONTROL_COLUMN) dx = right - (size.x - CONTROL_COLUMN);

    let dy = 0;
    if (top < EDGE) dy = top - EDGE;
    else if (bottom > size.y - covered - EDGE) dy = bottom - (size.y - covered - EDGE);

    if (dx !== 0 || dy !== 0) map.panBy([dx, dy], { animate: true, duration: 0.25 });
  }, []);

  /*
   * What a tap on a pin means depends on whether it is alone.
   *
   *   alone            → open it
   *   part of a stack  → open the stack
   *   part of an open fan → open it
   *
   * A pin under another pin cannot be tapped at all on a phone, so the first
   * tap on a stack has to be about reaching them rather than choosing one.
   */
  const handlePinTap = useCallback(
    (id: string) => {
      const map = mapRef.current;
      if (!map) return;

      if (fanRef.current?.ids.includes(id)) {
        collapseFan();
        selectRef.current(id);
        return;
      }

      collapseFan();

      const listings = listingsRef.current;
      const clicked = listings.find((item) => item.id === id);
      if (!clicked) return;

      const group = overlapGroup(map, listings, id);
      if (group.length > 1) {
        openFan(group, clicked);
        return;
      }

      selectRef.current(id);
    },
    [collapseFan, openFan],
  );

  // A fan is drawn in pixels at one zoom level, so it cannot survive another.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on('zoomstart', collapseFan);
    return () => {
      map.off('zoomstart', collapseFan);
    };
  }, [collapseFan]);

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
        handlePinTap(listing.id);
      });

      marker.addTo(layer);
      markers.set(listing.id, marker);
    }
  }, [listings, selectedId, handlePinTap]);

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

  /**
   * Frame every pin in the part of the map that is actually visible.
   *
   * On a phone the results pane floats over the bottom of the map, so the
   * camera has to treat that strip as off-screen — otherwise the frame looks
   * correct and the lowest pins sit behind the glass where nobody finds them.
   * The pane measures itself and hands the number down, because its height is
   * a share of the viewport when open and the sum of its chrome when folded,
   * and neither is worth reproducing here.
   */
  const fitToListings = useCallback(
    (animate: boolean) => {
      const map = mapRef.current;
      if (!map || listings.length === 0) return;

      // The pane sits beside the map rather than over it on a wide screen.
      const covered = window.innerWidth < 900 ? bottomInset : 0;

      map.fitBounds(
        L.latLngBounds(listings.map((listing) => [listing.lat, listing.lng] as [number, number])),
        {
          paddingTopLeft: [EDGE + PIN_SIDE, EDGE + PIN_UP],
          paddingBottomRight: [CONTROL_COLUMN + PIN_SIDE, EDGE + covered],
          maxZoom: 13,
          animate,
        },
      );
    },
    [listings, bottomInset],
  );

  // The default Armenia-wide view leaves most pins outside the strip a phone
  // has room for, so the first batch of listings sets the camera. Later batches
  // must not: by then the map is where the person put it.
  useEffect(() => {
    if (fittedRef.current || listings.length === 0 || bottomInset === 0) return;
    fittedRef.current = true;
    fittedInsetRef.current = bottomInset;
    fitToListings(false);
  }, [listings, bottomInset, fitToListings]);

  // Folding the pane away uncovers half the map, and raising it hides that half
  // again; either way the pins belong in whatever is left. Small changes are
  // ignored, because a phone's address bar sliding in and out resizes the pane
  // by a few pixels and should not move the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fittedRef.current) return;
    if (Math.abs(bottomInset - fittedInsetRef.current) < 40) return;

    fittedInsetRef.current = bottomInset;

    // With the pane pulled up over most of the map, there is no frame left to
    // aim at: refitting would squeeze the whole country into a sliver and leave
    // it there. The person is reading the list, not the map. Leave the camera
    // where it is and let the next step back down reframe it.
    if (bottomInset > map.getSize().y * 0.6) return;

    fitToListings(true);
  }, [bottomInset, fitToListings]);

  // ─── the services layer ──────────────────────────────────────────────────
  const items = services?.items;
  const servicesActive = services?.active ?? false;
  const serviceSelected = services?.selectedId ?? null;

  useEffect(() => {
    const map = mapRef.current;
    const layer = serviceLayerRef.current;
    if (!map || !layer || !items) return;

    const live = serviceMarkersRef.current;

    for (const service of items) {
      const icon = serviceIcon(service.category, service.id === serviceSelected);
      const existing = live.get(service.id);

      if (existing) {
        existing.setIcon(icon);
        continue;
      }

      const marker = L.marker([service.lat, service.lng], {
        icon,
        pane: 'services',
        riseOnHover: true,
        keyboard: true,
        alt: `${service.name} — ${SERVICE_LABELS[service.category]}`,
      });

      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        selectServiceRef.current(service.id);
      });

      marker.addTo(layer);
      live.set(service.id, marker);
    }

    for (const [id, marker] of live) {
      if (items.some((service) => service.id === id)) continue;
      layer.removeLayer(marker);
      live.delete(id);
    }
  }, [items, serviceSelected]);

  /*
   * Turning the layer on hands the map over to the services and frames them;
   * turning it off gives the seller back the view they had. Without the second
   * half, coming back from a shop in Armavir leaves someone in Tavush looking
   * at the wrong end of the country.
   */
  useEffect(() => {
    const map = mapRef.current;
    const layer = serviceLayerRef.current;
    if (!map || !layer) return;

    if (servicesActive) {
      beforeServicesRef.current = { center: map.getCenter(), zoom: map.getZoom() };
      layer.addTo(map);

      if (items && items.length > 0) {
        map.fitBounds(
          L.latLngBounds(items.map((s) => [s.lat, s.lng] as [number, number])),
          {
            paddingTopLeft: [EDGE + PIN_SIDE, EDGE + PIN_UP],
            paddingBottomRight: [CONTROL_COLUMN + PIN_SIDE, EDGE],
            maxZoom: 12,
            animate: true,
          },
        );
      }
      return;
    }

    map.removeLayer(layer);
    const previous = beforeServicesRef.current;
    if (previous) {
      map.setView(previous.center, previous.zoom, { animate: true });
      beforeServicesRef.current = null;
    }
  }, [servicesActive, items]);

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

  return (
    <div className="map-pane">
      <div
        ref={hostRef}
        className={`map-root${basemap === 'osm' ? ' is-osm' : ''}${
          servicesActive ? ' is-services' : ''
        }`}
        role="application"
        aria-label="Բերքի քարտեզ"
      />

      {/*
        Sellers only, and in the map's top-left corner rather than in the column
        of round buttons on the right. It has to carry its name — a toolbox icon
        on its own says nothing — and a button three times the width of its
        neighbours does not belong in their column. The top-left is the one
        corner of the map with nothing in it.
      */}
      {services ? (
        <button
          type="button"
          className={`map-service-btn${servicesActive ? ' is-on' : ''}${
            services.unseen && !servicesActive ? ' is-unseen' : ''
          }`}
          onClick={services.onToggle}
          aria-pressed={servicesActive}
        >
          <IconService size={16} />
          <span>Գյուղատնտեսական ծառայություն</span>
          {/* A switch, not just a colour change. Colour alone only tells you
              what state it is in once you already know it is a control — the
              track and knob say "this is pressable" before the first press. */}
          <span className="switch" aria-hidden="true">
            <i />
          </span>
        </button>
      ) : null}

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
    </div>
  );
}
