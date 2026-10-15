import L from 'leaflet';

/**
 * The map under the pins: OpenFreeMap's Positron style - pale grey land,
 * quiet water, no loud forests - so the produce pins are the only colour on
 * the screen. Free, no key, commercial use allowed, served by OpenFreeMap
 * (not Netlify). Rendered with MapLibre through the Leaflet bridge, so every
 * pin, control and gesture stays exactly as it was.
 *
 * Tuned on top of the stock style: place names in Armenian (OpenStreetMap's
 * name:hy, then the local name), water a soft blue so Sevan reads as a lake,
 * woods barely there, and the US road shields that the style carries
 * switched off.
 *
 * MapLibre is loaded only when a map is shown, as its own chunk. If anything
 * fails - no WebGL on an old phone, OpenFreeMap unreachable - the map falls
 * back to the OpenStreetMap tiles it used before.
 */

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ARMENIAN_NAME = ['coalesce', ['get', 'name:hy'], ['get', 'name'], ['get', 'name:latin']];

interface StyleLayer {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

function tune(style: { layers: StyleLayer[] }) {
  for (const layer of style.layers) {
    if (layer.type === 'symbol' && layer.layout?.['text-field'] && !layer.id.includes('shield')) {
      layer.layout['text-field'] = ARMENIAN_NAME;
    }
    if (layer.id.includes('shield')) {
      layer.layout = { ...layer.layout, visibility: 'none' };
    }
    if (layer.id === 'water') layer.paint = { ...layer.paint, 'fill-color': '#cfe2ec' };
    if (layer.id === 'waterway') layer.paint = { ...layer.paint, 'line-color': '#cfe2ec' };
    if (layer.id === 'landcover_wood' || layer.id === 'park') {
      layer.paint = { ...layer.paint, 'fill-color': '#e8ece6' };
    }
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Fetched and tuned once per visit; switching back from the satellite view
// reuses it. A failure is not kept, so the next map tries again.
let stylePromise: Promise<{ layers: StyleLayer[] }> | null = null;

function loadStyle() {
  stylePromise ??= fetch(STYLE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`style ${response.status}`);
      return response.json();
    })
    .then((style) => {
      tune(style);
      return style;
    });
  stylePromise.catch(() => {
    stylePromise = null;
  });
  return stylePromise;
}

async function vectorLayer(): Promise<L.Layer> {
  if (!webglAvailable()) throw new Error('no WebGL');
  const [style, bridge] = await Promise.all([
    loadStyle(),
    import('@maplibre/maplibre-gl-leaflet'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  // A fresh copy: MapLibre keeps the object it is given.
  const ownStyle = structuredClone(style);
  // attribution is read by Leaflet's own control (L.Layer.getAttribution);
  // MapLibre's control is off so the credit is not shown twice.
  return bridge.maplibreGL({
    style: ownStyle,
    attributionControl: false,
    attribution: ATTRIBUTION,
  } as unknown as L.LeafletMaplibreGLOptions);
}

export interface Basemap {
  remove: () => void;
}

/**
 * Puts the street map under `map`. Resolves once a layer is on the map;
 * `onFallback` runs if it had to be the raster OpenStreetMap tiles (which
 * need the colour wash the vector style does not).
 */
export function addStreetBasemap(map: L.Map, onFallback?: () => void): Basemap {
  let layer: L.Layer | null = null;
  let removed = false;

  vectorLayer()
    .then((vector) => {
      if (removed) return;
      layer = vector.addTo(map);
      // Leaflet's credit line does not pick up the bridge's own option.
      map.attributionControl?.addAttribution(ATTRIBUTION);
    })
    .catch(() => {
      if (removed) return;
      layer = L.tileLayer(OSM_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      onFallback?.();
    });

  return {
    remove: () => {
      removed = true;
      layer?.remove();
      map.attributionControl?.removeAttribution(ATTRIBUTION);
    },
  };
}
