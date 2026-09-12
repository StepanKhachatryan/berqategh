/*
 * Turns the originals in produce-images/ into the small WebP files the app ships.
 *
 * Chromium does the work, because it is already here for other tooling and it
 * encodes WebP with an alpha channel — which matters, since these sit inside a
 * white ring and a rectangular background would show. No image library needed.
 *
 *   npm run icons
 *
 * A file is named after the produce id it belongs to (apple.png → apple.webp),
 * and the app picks it up automatically. Anything already converted is skipped
 * unless the original is newer, so re-running is cheap.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'This script needs Playwright for the WebP encoder:\n' +
      '  npm i -g playwright && npx playwright install chromium\n' +
      'It is deliberately not a dependency of the app — the site builds without it,\n' +
      'and only the person adding a new picture ever runs this.',
  );
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'produce-images');
const OUT = join(root, 'src/assets/produce');

// 62px is the largest the mark is ever drawn (the listing detail hero), so 128
// covers a 2x screen. Past that the file grows and nothing looks better.
const SIZE = 128;
const QUALITY = 0.86;
// A hair of breathing room inside the 128px square, so the crop never touches
// the ring it is drawn inside.
const MARGIN = 0.03;

const INPUT = new Set(['.png', '.webp', '.jpg', '.jpeg']);

mkdirSync(OUT, { recursive: true });

const sources = readdirSync(SRC)
  .filter((name) => INPUT.has(extname(name).toLowerCase()))
  .map((name) => ({ name, id: basename(name, extname(name)), path: join(SRC, name) }));

if (sources.length === 0) {
  console.log('produce-images/ is empty — nothing to build.');
  process.exit(0);
}

const pending = sources.filter(({ id, path }) => {
  const out = join(OUT, `${id}.webp`);
  if (!existsSync(out)) return true;
  return statSync(path).mtimeMs > statSync(out).mtimeMs;
});

if (pending.length === 0) {
  console.log(`${sources.length} icon(s) already up to date.`);
  process.exit(0);
}

/**
 * Playwright downloads a browser build pinned to its own version, and a machine
 * that already has a slightly older one installed will not match. Rather than
 * make everyone re-download 150 MB to resize a picture, fall back to whatever
 * Chromium is actually on disk.
 */
async function launch() {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM;
  if (explicit) return chromium.launch({ executablePath: explicit });

  try {
    return await chromium.launch();
  } catch (err) {
    const dir = process.env.PLAYWRIGHT_BROWSERS_PATH;
    const found = dir && existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.startsWith('chromium-'))
          .map((name) => join(dir, name, 'chrome-linux', 'chrome'))
          .find((path) => existsSync(path))
      : null;

    if (!found) throw err;
    console.log(`Using ${found}`);
    return chromium.launch({ executablePath: found });
  }
}

const browser = await launch();
const page = await browser.newPage();
await page.goto('about:blank');

let total = 0;

for (const { name, id, path } of pending) {
  const dataUrl = `data:image/${extname(path).slice(1)};base64,${readFileSync(path).toString('base64')}`;

  const encoded = await page.evaluate(
    async ([src, size, quality, margin]) => {
      const img = new Image();
      img.src = src;
      await img.decode();

      // ── find where the subject actually is ────────────────────────────
      // Stock photos come with wildly different amounts of empty space
      // around the crop. Left alone, one apple would fill its circle and the
      // next sit as a dot in the middle of it. Trimming first means every
      // icon is framed the same way whoever produced the original.
      const scan = document.createElement('canvas');
      const SCAN = 400;
      const s = Math.min(SCAN / img.width, SCAN / img.height, 1);
      scan.width = Math.max(1, Math.round(img.width * s));
      scan.height = Math.max(1, Math.round(img.height * s));
      const sctx = scan.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(img, 0, 0, scan.width, scan.height);
      const { data } = sctx.getImageData(0, 0, scan.width, scan.height);

      // Two ways to be background: transparent (a cut-out PNG) or near-white
      // (a photo shot on a white sweep). Try transparency first and fall back,
      // so both kinds of original get framed alike.
      const bbox = (isBackground) => {
        let x0 = scan.width, y0 = scan.height, x1 = -1, y1 = -1;
        for (let y = 0; y < scan.height; y++) {
          for (let x = 0; x < scan.width; x++) {
            const i = (y * scan.width + x) * 4;
            if (isBackground(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
        return x1 < x0 ? null : { x0, y0, x1, y1 };
      };

      const full = scan.width * scan.height;
      let box = bbox((_r, _g, _b, a) => a < 16);
      const covers = box && (box.x1 - box.x0 + 1) * (box.y1 - box.y0 + 1) > full * 0.97;
      if (!box || covers) {
        box = bbox((r, g, b, a) => a > 16 && r > 244 && g > 244 && b > 244);
      }
      if (!box) box = { x0: 0, y0: 0, x1: scan.width - 1, y1: scan.height - 1 };

      // Back to source pixels, with one scan pixel of slack so the trim never
      // clips a soft edge.
      const sx = Math.max(0, (box.x0 - 1) / s);
      const sy = Math.max(0, (box.y0 - 1) / s);
      const sw = Math.min(img.width - sx, (box.x1 - box.x0 + 3) / s);
      const sh = Math.min(img.height - sy, (box.y1 - box.y0 + 3) / s);

      // ── draw it ───────────────────────────────────────────────────────
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';

      // Fit the longest side and centre it, so a long pepper is not squashed
      // into a square and a round apple is not cropped at the shoulders.
      const box_ = size * (1 - margin * 2);
      const scale = Math.min(box_ / sw, box_ / sh);
      const w = sw * scale;
      const h = sh * scale;
      ctx.drawImage(img, sx, sy, sw, sh, (size - w) / 2, (size - h) / 2, w, h);

      return canvas.toDataURL('image/webp', quality);
    },
    [dataUrl, SIZE, QUALITY, MARGIN],
  );

  const bytes = Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64');
  writeFileSync(join(OUT, `${id}.webp`), bytes);
  total += bytes.length;
  console.log(`  ${name.padEnd(24)} → ${id}.webp  ${(bytes.length / 1024).toFixed(1)} KB`);
}

await browser.close();
console.log(`\n${pending.length} icon(s), ${(total / 1024).toFixed(0)} KB total.`);
