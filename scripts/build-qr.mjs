/*
 * Draws the QR code for the site's address, once, into a checked-in SVG.
 *
 *   npm run qr
 *
 * No QR service is involved. The picture is not fetched from anywhere at page
 * load and nothing is sent to a third party when somebody opens the guide —
 * which also means it works on a projector in a village hall with no signal.
 *
 * It is generated here rather than in the browser because the address never
 * changes: shipping an encoder to every visitor to draw the same 29 squares
 * would cost them kilobytes for a picture that could be a file. The file is
 * about 2 KB and scales to any size, being paths rather than pixels.
 *
 * Error correction is at its highest setting. The code is meant to be scanned
 * off a screen at an angle from across a room, where a third of it may be
 * washed out by glare, and at this length the highest level still fits in a
 * small grid.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Read out of src/lib/site.ts rather than repeated here, so the picture and the
 * address on the page can never drift apart. A three-line parse beats a second
 * copy of the truth.
 */
const site = readFileSync(join(root, 'src/lib/site.ts'), 'utf8');
const match = site.match(/SITE_URL\s*=\s*'([^']+)'/);
if (!match) throw new Error('SITE_URL not found in src/lib/site.ts');
const SITE_URL = match[1];

const svg = await QRCode.toString(SITE_URL, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 1,
  color: { dark: '#10251aff', light: '#ffffffff' },
});

const out = join(root, 'src/assets');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'qr-berqategh.svg'), svg);

const modules = (await QRCode.create(SITE_URL, { errorCorrectionLevel: 'H' })).modules.size;
console.log(
  `${SITE_URL} → src/assets/qr-berqategh.svg  ` +
    `${modules}×${modules} modules, ${(svg.length / 1024).toFixed(1)} KB`,
);
