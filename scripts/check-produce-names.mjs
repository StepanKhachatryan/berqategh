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

// The offering ids, from the OfferingId type in services.ts.
const servicesSource = readFileSync(join(root, 'src/data/services.ts'), 'utf8');
const typeBody = servicesSource.slice(servicesSource.indexOf('export type OfferingId'), servicesSource.indexOf('export interface Offering'));
const offeringIds = new Set([...typeBody.matchAll(/\|\s*'([^']+)'/g)].map((m) => m[1]));

// The advertisers' ids, from SERVICES in the same file.
const serviceIds = new Set([...servicesSource.matchAll(/\bid: '([^']+)',\s*name:/g)].map((m) => m[1]));

const INPUT = new Set(['.png', '.webp', '.jpg', '.jpeg']);

// Suggest the id the file was probably meant to have.
const near = (name, known) => {
  const stem = basename(name, extname(name)).toLowerCase().replace(/_/g, '-');
  // An exact match once underscores become hyphens (grape_white -> grape-white)
  // beats a prefix match (grape), which beats any other id sharing the first word.
  const guess =
    (known.has(stem) && stem) ||
    [...known].filter((id) => stem.startsWith(id)).sort((a, b) => b.length - a.length)[0] ||
    [...known].find((id) => id.startsWith(stem.split('-')[0]));
  return guess ? ` - did you mean "${guess}${extname(name)}"?` : '';
};

let failed = false;
for (const { folder, known, what, where } of [
  { folder: 'produce-images', known: ids, what: 'crop', where: 'src/data/produce.ts' },
  { folder: 'service-images', known: offeringIds, what: 'offering', where: 'service-images/README.md' },
  { folder: 'service-logos', known: serviceIds, what: 'advertiser', where: 'service-logos/README.md' },
]) {
  let names = [];
  try {
    names = readdirSync(join(root, folder));
  } catch {
    continue;
  }
  const unknown = names
    .filter((name) => INPUT.has(extname(name).toLowerCase()))
    // The converter reads an underscore as a hyphen, so grape_white.png is fine.
    .filter((name) => !known.has(basename(name, extname(name)).replace(/_/g, '-')));

  if (unknown.length === 0) {
    console.log(`All pictures in ${folder}/ match ${/^[aeiou]/.test(what) ? "an" : "a"} ${what} (${known.size} names known).`);
    continue;
  }
  failed = true;
  console.error(`These pictures in ${folder}/ match no ${what}, so the site will never show them:`);
  for (const name of unknown) {
    console.error(`  ${folder}/${name}${near(name, known)}`);
    // Shown as an annotation on the workflow run in GitHub.
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error file=${folder}/${name}::No ${what} has the id "${basename(name, extname(name))}"${near(name, known)}`);
    }
  }
  console.error(`Rename each to an id listed in ${where}.`);
}
process.exit(failed ? 1 : 0);
