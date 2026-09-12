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

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});
const page = await browser.newPage();
await page.goto('about:blank');

let total = 0;

for (const { name, id, path } of pending) {
  const dataUrl = `data:image/${extname(path).slice(1)};base64,${readFileSync(path).toString('base64')}`;

  const encoded = await page.evaluate(
    async ([src, size, quality]) => {
      const img = new Image();
      img.src = src;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';

      // Fit the longest side and centre it, so a portrait photo is not squashed
      // into a square and a small subject is not blown up past its resolution.
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

      return canvas.toDataURL('image/webp', quality);
    },
    [dataUrl, SIZE, QUALITY],
  );

  const bytes = Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64');
  writeFileSync(join(OUT, `${id}.webp`), bytes);
  total += bytes.length;
  console.log(`  ${name.padEnd(24)} → ${id}.webp  ${(bytes.length / 1024).toFixed(1)} KB`);
}

await browser.close();
console.log(`\n${pending.length} icon(s), ${(total / 1024).toFixed(0)} KB total.`);
