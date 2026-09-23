import L from 'leaflet';
import { produceColor, produceEmoji } from '../data/produce';
import { produceImage } from '../data/produceImages';
import type { CSSProperties } from 'react';
import type { ProduceForm, SaleType } from '../lib/types';
import {
  OFFERINGS,
  primaryOffering,
  type AgriService,
  type Offering,
} from '../data/services';

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

/**
 * What goes in the head of the pin: the crop's photograph when the catalogue
 * has one, its emoji otherwise.
 *
 * Leaflet builds markers from an HTML string rather than from React, so this
 * cannot be the shared ProduceMark component — but the two must agree, or the
 * same tomato would be a picture in the list and a drawing on the map.
 *
 * Dried produce gets the plate of չիր rather than the fresh crop, which is the
 * whole reason a dried fig on the map was an unreadable green blob: its emoji
 * was 🫒, and at pin size an olive and a fig are the same dark smudge.
 */
function pinMark(productId: string, form: ProduceForm): string {
  const src = produceImage(productId, form);
  // The URL is emitted by the bundler, not by anything a seller typed.
  if (src) return `<img class="pin-photo" src="${src}" alt="">`;

  return produceEmoji(productId);
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
    <div class="pin-emoji" style="top:${(cy - 8) * scale}px;font-size:${16 * scale}px">${pinMark(productId, form)}</div>
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

/*
 * Service markers.
 *
 * Services are drawn in the one hue no crop on the map uses. Produce covers
 * nearly the whole wheel - tomato red, apricot orange, corn yellow, cucumber
 * green, plum purple, walnut brown - and cyan is the gap. A seller turning
 * the services layer on should be able to tell a shop from a harvest by colour
 * before they have read a single symbol, including when the produce has faded
 * into the background behind it.
 *
 * Shape says the rest: a rounded square where produce is a teardrop, a crate
 * or a gem.
 */
export const SERVICE_FILL = '#0891b2';
const SERVICE_EDGE = '#0e6d86';

const SW = 40;
const SH = 48;

// A squircle with a short stem, so it still points at a place rather than
// hovering over one.
const SERVICE_SHAPE =
  'M11 3h18a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-4.5L20 45l-4.5-12H11a8 8 0 0 1-8-8V11a8 8 0 0 1 8-8z';

/** The same construction as a produce pin: white halo, coloured body, white window. */
export function serviceSvg(scale = 1): string {
  return `<svg width="${SW * scale}" height="${SH * scale}" viewBox="0 0 ${SW} ${SH}" xmlns="http://www.w3.org/2000/svg">
    <path d="${SERVICE_SHAPE}" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <path d="${SERVICE_SHAPE}" fill="${SERVICE_FILL}" stroke="${SERVICE_EDGE}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="7.5" y="7.5" width="25" height="21" rx="5" fill="#fff"/>
  </svg>`;
}

function regularServiceIcon(service: AgriService, selected: boolean): L.DivIcon {
  const scale = selected ? 1.18 : 1;

  const html = `<div class="pin-body" style="width:${SW * scale}px;height:${SH * scale}px">
    ${serviceSvg(scale)}
    <div class="pin-emoji" style="top:${9.5 * scale}px;font-size:${16 * scale}px">${primaryOffering(service).emoji}</div>
  </div>`;

  return L.divIcon({
    html,
    className: `pin pin-service${selected ? ' pin-selected' : ''}`,
    iconSize: [SW * scale, SH * scale],
    iconAnchor: [20 * scale, 45 * scale],
  });
}

/*
 * Premium: a speech bubble that is really a box, turning over.
 *
 * The bubble is a four-sided box lying on its long axis, and it rolls a
 * quarter turn at a time, so each face it brings round shows the next thing
 * the business sells. Four sides, because that is what a box has - the thing
 * asked for was a cuboid, not a drum.
 *
 * Four sides and any number of offerings do not divide evenly, and that is
 * the whole difficulty. Two offerings go A B A B and four go A B C D, one per
 * side, fixed. But three on four sides would come round as A B C A and then
 * A again, a roll that changes nothing. So when the count does not divide
 * four, each side carries every offering it will ever need stacked on top of
 * itself, and switches which one is showing at the moment that side is
 * facing directly away - the one moment nobody can see it. The sequence the
 * viewer sees is then simply A B C A B C, for any count.
 *
 * All of it is CSS keyframes with computed delays. Nothing runs in JavaScript
 * once the marker is drawn, so a map with several of these costs nothing
 * while it sits there.
 */

/** One step: how long a face is held, plus the quarter turn to the next. */
const STEP_S = 2.6;
/** The most offerings a bubble turns through; the sheet lists the rest. */
const MAX_FACES = 6;
/** Where the tail meets the ground, measured from the bubble's left edge. */
const TAIL_X = 20;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** A stable offset per marker, so a map full of these does not turn in unison. */
function stagger(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 1000) / 1000 * 4 * STEP_S;
}

function faceContent(offering: Offering): string {
  return `<span class="pb-emoji">${offering.emoji}</span><span class="pb-text">${offering.short}</span>`;
}

function premiumServiceIcon(service: AgriService, selected: boolean): L.DivIcon {
  const shown = service.offerings.slice(0, MAX_FACES).map((id) => OFFERINGS[id]);
  const n = shown.length;
  const offset = stagger(service.id);

  // Every label, stacked in one grid cell and hidden: the widest sets the
  // width of the box, so no face is ever clipped and none is wider than it
  // needs to be.
  const sizer = shown
    .map((offering) => `<span class="pb-sizer-cell">${faceContent(offering)}</span>`)
    .join('');

  let prism: string;

  if (n === 1) {
    // Nothing to turn to.
    prism = `<div class="pb-prism is-still">
      <div class="pb-face" style="transform:translateZ(0)"><div class="pb-layer pb-on">${faceContent(shown[0])}</div></div>
    </div>`;
  } else {
    // In steps, how long before the sequence of (side, offering) repeats.
    const period = (4 * n) / gcd(4, n);
    const fixed = period === 4;

    const faces = [0, 1, 2, 3].map((side) => {
      let layers: string;

      if (fixed) {
        layers = `<div class="pb-layer pb-on">${faceContent(shown[side % n])}</div>`;
      } else {
        // Each time this side comes to the front within one period, it shows
        // offering (step mod n). The layer for that step is visible for the
        // four steps centred on it: it appears while the side is facing away
        // and disappears the next time it faces away.
        layers = Array.from({ length: period / 4 }, (_, round) => {
          const step = side + 4 * round;
          const start = ((step - 2 + period) % period) * STEP_S;
          const delay = start - period * STEP_S - offset;
          // The first side's first offering is what shows when motion is off.
          const first = step === 0 ? ' pb-on' : '';
          return `<div class="pb-layer${first}" style="animation:pb-layer-${period} ${period * STEP_S}s step-end ${delay.toFixed(2)}s infinite">${faceContent(shown[step % n])}</div>`;
        }).join('');
      }

      // Side k sits a quarter turn behind side k-1, half the box's height out
      // from its axis - the box has a square cross-section, so every side is
      // the same height as the one facing you.
      return `<div class="pb-face" style="transform:rotateX(${-90 * side}deg) translateZ(var(--pb-half))">${layers}</div>`;
    }).join('');

    // Duration set here as well as in the stylesheet, so STEP_S is the one
    // number to change: the layer delays above are computed against it.
    prism = `<div class="pb-prism" style="animation-duration:${4 * STEP_S}s;animation-delay:${(-offset).toFixed(2)}s">${faces}</div>`;
  }

  const html = `<div class="premium-pin${selected ? ' is-selected' : ''}" style="--pb-tail-x:${TAIL_X}px">
    <div class="pb-stage">
      <div class="pb-sizer" aria-hidden="true">${sizer}</div>
      ${prism}
    </div>
    <div class="pb-tail"></div>
  </div>`;

  // Zero-sized and anchored at its own origin: the bubble's width depends on
  // its longest label, which is only known once it is laid out, so it places
  // itself instead - see .premium-pin, which puts the tail's tip on the point.
  return L.divIcon({
    html,
    className: `pin pin-premium${selected ? ' pin-selected' : ''}`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function serviceIcon(service: AgriService, selected = false): L.DivIcon {
  return service.tier === 'premium'
    ? premiumServiceIcon(service, selected)
    : regularServiceIcon(service, selected);
}
