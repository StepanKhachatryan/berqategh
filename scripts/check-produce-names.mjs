/*
 * Every original in produce-images/ must be named after a crop in the
 * catalogue, or it is converted and then never shown.
 *
 *   npm run icons:check
 *
 * The app finds a crop's picture by file name alone, so grape_red.png - for a
 * crop whose id is `grape` - converts without complaint and then sits unused
 * while the grape keeps its emoji. Nothing looks broken; the picture just
 * never appears. This makes that loud: it lists the names that match nothing
 * and fails, which on GitHub turns the workflow red and sends the usual
 * failure email. The workflow runs it after committing, so the pictures that
 * are named right are never held back by one that is not.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The ids straight out of the catalogue, rather than a second list to keep in step.
const catalogue = readFileSync(join(root, 'src/data/produce.ts'), 'utf8');
const ids = new Set([...catalogue.matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1]));
// Pictures that stand for a group rather than one crop (see produceImages.ts).
for (const group of ['honey', 'dried']) ids.add(group);

const INPUT = new Set(['.png', '.webp', '.jpg', '.jpeg']);
const unknown = readdirSync(join(root, 'produce-images'))
  .filter((name) => INPUT.has(extname(name).toLowerCase()))
  .filter((name) => !ids.has(basename(name, extname(name))));

if (unknown.length === 0) {
  console.log(`All pictures in produce-images/ match a crop (${ids.size} names known).`);
  process.exit(0);
}

// Suggest the id the file was probably meant to have.
const near = (name) => {
  const stem = basename(name, extname(name)).toLowerCase().replace(/_/g, '-');
  const guess = [...ids].find((id) => stem === id || stem.startsWith(id) || id.startsWith(stem.split('-')[0]));
  return guess ? ` - did you mean "${guess}${extname(name)}"?` : '';
};

console.error('These pictures match no crop, so the site will never show them:');
for (const name of unknown) {
  console.error(`  produce-images/${name}${near(name)}`);
  // Shown as an annotation on the workflow run in GitHub.
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::error file=produce-images/${name}::No crop has the id "${basename(name, extname(name))}"${near(name)}`);
  }
}
console.error('Rename each to the crop id used in src/data/produce.ts.');
process.exit(1);
