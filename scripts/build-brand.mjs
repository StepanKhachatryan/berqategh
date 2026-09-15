/*
 * Cuts the whole icon set out of one drawing of the logo.
 *
 *   npm run brand
 *
 * The source lives in brand/logo-source.png: a green disc with a white pin
 * bitten out of it and an apricot inside the pin, sitting on a white page. The
 * page is not part of the logo, so everything here starts by finding where the
 * disc actually is rather than trusting the canvas.
 *
 * Four things come out, and they are different on purpose:
 *
 *   logo.png              the disc alone, transparent outside it, for the page
 *   icon-192 / icon-512   the disc on white, because an Apple touch icon that
 *                         is transparent comes out black
 *   icon-maskable-512     green to all four corners with only the pin inside
 *                         the safe circle, because Android crops this one to
 *                         whatever shape the phone happens to use
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('This script needs Playwright: npm i -g playwright && npx playwright install chromium');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'brand/logo-source.png');
const OUT = join(root, 'public');

mkdirSync(OUT, { recursive: true });

async function launch() {
  try {
    return await chromium.launch();
  } catch (err) {
    const dir = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (!dir) throw err;
    const { readdirSync, existsSync } = await import('node:fs');
    const found = readdirSync(dir)
      .filter((n) => n.startsWith('chromium-'))
      .map((n) => join(dir, n, 'chrome-linux', 'chrome'))
      .find((p) => existsSync(p));
    if (!found) throw err;
    return chromium.launch({ executablePath: found });
  }
}

const browser = await launch();
const page = await browser.newPage();
await page.goto('about:blank');

const dataUrl = `data:image/png;base64,${readFileSync(SOURCE).toString('base64')}`;

const files = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();

  const probe = document.createElement('canvas');
  probe.width = img.width;
  probe.height = img.height;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  pctx.drawImage(img, 0, 0);
  const { data } = pctx.getImageData(0, 0, probe.width, probe.height);
  const at = (x, y) => {
    const i = (y * probe.width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // ── where is the disc? ──────────────────────────────────────────────────
  // By its colour, not by where the white stops: the source has stray dark
  // pixels along its edges that a plain "not white" test picks up as logo.
  const tally = new Map();
  for (let y = 0; y < probe.height; y += 3) {
    for (let x = 0; x < probe.width; x += 3) {
      const [r, g, b] = at(x, y);
      if (r > 240 && g > 240 && b > 240) continue;
      const key = `${r >> 3},${g >> 3},${b >> 3}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    }
  }
  const [key] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const brand = key.split(',').map((n) => (Number(n) << 3) + 4);
  const isBrand = (r, g, b) =>
    Math.abs(r - brand[0]) < 26 && Math.abs(g - brand[1]) < 26 && Math.abs(b - brand[2]) < 26;

  const box = (test) => {
    let x0 = probe.width, y0 = probe.height, x1 = -1, y1 = -1;
    for (let y = 0; y < probe.height; y++) {
      for (let x = 0; x < probe.width; x++) {
        if (!test(x, y, ...at(x, y))) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { x0, y0, x1, y1 };
  };

  const disc = box((_x, _y, r, g, b) => isBrand(r, g, b));
  const cx = (disc.x0 + disc.x1) / 2;
  const cy = (disc.y0 + disc.y1) / 2;
  const radius = Math.min(disc.x1 - disc.x0, disc.y1 - disc.y0) / 2;

  // ── and where is the pin inside it? ─────────────────────────────────────
  const inside = radius - 6;
  const pin = box((x, y, r, g, b) => {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > inside * inside) return false;
    return r > 240 && g > 240 && b > 240;
  });

  /*
   * The disc in the source is a photograph of a flat colour: faintly noisy,
   * which a PNG cannot compress and which shows as mottling when scaled down.
   * So the green is repainted flat and only the pin is taken from the source —
   * lifted out on its own by dropping every pixel that is already the brand
   * colour. The result is both cleaner and several times smaller.
   */
  const cutout = (() => {
    const pad = 18;
    const half = Math.max(pin.x1 - pin.x0, pin.y1 - pin.y0) / 2 + pad;
    const pinCx = (pin.x0 + pin.x1) / 2;
    const pinCy = (pin.y0 + pin.y1) / 2;

    const c = document.createElement('canvas');
    c.width = Math.round(half * 2);
    c.height = Math.round(half * 2);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, pinCx - half, pinCy - half, half * 2, half * 2, 0, 0, c.width, c.height);

    const frame = ctx.getImageData(0, 0, c.width, c.height);
    const px = frame.data;
    for (let i = 0; i < px.length; i += 4) {
      if (isBrand(px[i], px[i + 1], px[i + 2])) px[i + 3] = 0;
    }
    ctx.putImageData(frame, 0, 0);

    // Where the pin sits inside this square, as a fraction of it.
    return { canvas: c, share: (half * 2) / (radius * 2) };
  })();

  const fill = `rgb(${brand[0]}, ${brand[1]}, ${brand[2]})`;

  const draw = (size, paint, type = 'image/png', quality, height) => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = height ?? size;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    paint(ctx, size, c.height);
    return c.toDataURL(type, quality);
  };

  /** The pin, drawn at the size it occupies within a disc of the given width. */
  const stampPin = (ctx, discSize, cxPx, cyPx = cxPx) => {
    const side = discSize * cutout.share;
    ctx.drawImage(cutout.canvas, cxPx - side / 2, cyPx - side / 2, side, side);
  };

  // The disc alone, transparent outside it.
  const discOnly = (ctx, size) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    stampPin(ctx, size, size / 2);
  };

  const onWhite = (ctx, size) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    // A whisker of margin so the disc does not touch the square's edge.
    const inset = Math.round(size * 0.04);
    const disc = size - inset * 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, disc / 2, 0, Math.PI * 2);
    ctx.fill();
    stampPin(ctx, disc, size / 2);
  };

  /*
   * Maskable: the phone crops this to a circle, a squircle or a rounded square
   * of its choosing, and only the middle 80% is guaranteed to survive. Shrinking
   * the whole disc into that circle would leave it swimming in a white ring, so
   * the green runs to every corner instead and the pin alone sits in the safe
   * zone.
   */
  /* The card Messenger, Facebook and LinkedIn show when the link is pasted. */
  const card = (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const disc = Math.round(h * 0.62);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, disc / 2, 0, Math.PI * 2);
    ctx.fill();
    stampPin(ctx, disc, w / 2, h / 2);
  };

  const maskable = (ctx, size) => {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size, size);
    stampPin(ctx, size * 0.78 / cutout.share, size / 2);
  };

  return {
    brand,
    disc: { cx, cy, radius },
    pin,
    fits: Math.hypot(
      Math.max(pin.x1 - pin.x0, pin.y1 - pin.y0) / 2 + 18,
      Math.max(pin.x1 - pin.x0, pin.y1 - pin.y0) / 2 + 18,
    ) <= radius,
    out: {
      // The page only ever draws it at 32px and 76px; 256 covers a 3x screen.
      'logo.webp': draw(256, discOnly, 'image/webp', 0.92),
      'favicon-96.png': draw(96, discOnly),
      'icon-192.png': draw(192, onWhite),
      'icon-512.png': draw(512, onWhite),
      'icon-maskable-512.png': draw(512, maskable),
      'og-image.png': draw(1200, card, 'image/png', undefined, 630),

      /*
       * Hand-off copies, for slides, letters, printers and anyone who asks for
       * "the logo". Large and PNG rather than WebP, because that is what every
       * other program on earth can open.
       */
      'brand/berqategh-logo.png': draw(1024, discOnly),
      'brand/berqategh-logo-on-white.png': draw(1024, onWhite),
      'brand/berqategh-logo-wide.png': draw(1200, card, 'image/png', undefined, 630),
    },
  };
}, dataUrl);

console.log(
  `brand colour rgb(${files.brand.join(', ')}) · disc r=${Math.round(files.disc.radius)}px · ` +
    `pin square inside disc: ${files.fits ? 'yes' : 'NO — corners would leak white'}`,
);

// Names carrying a folder go where they say; the rest go to the site's public/.
for (const [name, url] of Object.entries(files.out)) {
  const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  const target = name.includes('/') ? join(root, name) : join(OUT, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  console.log(`  ${name.padEnd(34)} ${(bytes.length / 1024).toFixed(1)} KB`);
}

await browser.close();
