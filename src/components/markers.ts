import L from 'leaflet';
import { produceColor, produceEmoji } from '../data/produce';
import type { CSSProperties } from 'react';
import type { ProduceForm, SaleType } from '../lib/types';

/**
 * Map symbols carry two independent facts at once:
 *
 *   • the SHAPE says how the farmer sells — retail only, wholesale only, or both;
 *   • the COLOUR says what is being sold, matched to the real colour of the crop
 *     (tomatoes red, eggplant purple, corn yellow …).
 *
 * Shape is what survives at small sizes and for colour-blind users, so the
 * commercially important distinction rides on it rather than on hue.
 */

const W = 42;
const H = 53;

/** Every silhouette ends at the same point so anchoring stays consistent. */
const SHAPES: Record<SaleType, string> = {
  // Retail — the familiar round map pin. One buyer, one bag.
  retail: 'M21 50C21 50 37.5 30 37.5 20A16.5 16.5 0 1 0 4.5 20C4.5 30 21 50 21 50Z',

  // Wholesale — a crate. Square shoulders read as "by the box, not by the kilo".
  wholesale:
    'M9.5 4H32.5A5.5 5.5 0 0 1 38 9.5V28.5A5.5 5.5 0 0 1 32.5 34H26L21 50L16 34H9.5A5.5 5.5 0 0 1 4 28.5V9.5A5.5 5.5 0 0 1 9.5 4Z',

  // Both — a faceted gem, visibly richer than either single-channel shape.
  both: 'M21 3L38 12.5V31L21 50L4 31V12.5Z',
};

const BODY_CY = { retail: 20, wholesale: 19, both: 19 } as const;

function darken(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;

  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(full.slice(offset, offset + 2), 16);
    return Math.max(0, Math.round(channel * (1 - amount)));
  });

  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The colour a listing is drawn in. Dried produce keeps its crop's hue but
 * comes out deeper and duller — which is what actually happens when fruit
 * dries, so the map reads right without needing a fourth symbol shape.
 */
export function listingColor(productId: string, form: ProduceForm = 'fresh'): string {
  const base = produceColor(productId);
  return form === 'dried' ? darken(base, 0.3) : base;
}

export function pinSvg(saleType: SaleType, color: string, scale = 1): string {
  const shape = SHAPES[saleType];
  const cy = BODY_CY[saleType];
  const edge = darken(color, 0.3);

  return `<svg width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <path d="${shape}" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <path d="${shape}" fill="${color}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="21" cy="${cy}" r="10.5" fill="#fff" fill-opacity="0.94"/>
  </svg>`;
}

interface PinOptions {
  saleType: SaleType;
  productId: string;
  form?: ProduceForm;
  selected?: boolean;
  animate?: boolean;
}

export function listingIcon({
  saleType,
  productId,
  form = 'fresh',
  selected = false,
  animate = false,
}: PinOptions): L.DivIcon {
  const scale = selected ? 1.22 : 1;
  const color = listingColor(productId, form);
  const cy = BODY_CY[saleType];

  const classes = ['pin'];
  if (selected) classes.push('pin-selected');

  // The drop-in animation lives on the inner wrapper, never on the marker root:
  // Leaflet positions markers with an inline `transform`, and a CSS animation
  // touching `transform` on the same element outranks it and collapses every
  // pin onto the pane origin.
  const body = `pin-body${animate ? ' pin-enter' : ''}`;

  const html = `<div class="${body}" style="width:${W * scale}px;height:${H * scale}px">
    ${pinSvg(saleType, color, scale)}
    <div class="pin-emoji" style="top:${(cy - 8) * scale}px;font-size:${16 * scale}px">${produceEmoji(productId)}</div>
  </div>`;

  return L.divIcon({
    html,
    className: classes.join(' '),
    iconSize: [W * scale, H * scale],
    iconAnchor: [21 * scale, 51 * scale],
    popupAnchor: [0, -44 * scale],
  });
}

/** The blue dot showing where the buyer (or seller) currently is. */
export function meIcon(): L.DivIcon {
  return L.divIcon({
    html: '<span></span>',
    className: 'me-dot',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  retail: 'Մանրածախ',
  wholesale: 'Մեծածախ',
  both: 'Մանրածախ և մեծածախ',
};

export const SALE_TYPE_SHORT: Record<SaleType, string> = {
  retail: 'Մանրածախ',
  wholesale: 'Մեծածախ',
  both: 'Երկուսն էլ',
};

/**
 * Inline custom properties for the round produce swatches.
 *
 * A swatch used to be a disc filled with the crop's own colour with the emoji
 * laid on top, which hid every crop whose colour matched its own fruit — an
 * olive on olive green, a cherry on cherry red. The fill is now white and the
 * colour has moved to the ring and the glow around it, so the produce reads
 * against a clean ground while the hue still identifies it at a glance.
 *
 * Alpha is baked into 8-digit hex rather than color-mix(), which Safari only
 * learned in 16.2 — a good share of the phones reaching this site are older.
 */
export function swatchStyle(color: string): CSSProperties {
  return {
    '--fruit': color,
    '--fruit-soft': `${color}1f`,
    '--fruit-glow': `${color}55`,
  } as CSSProperties;
}
