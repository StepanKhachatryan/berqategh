/*
 * Prints the Postgres regular expression for src/lib/moderation-terms.json,
 * so the database rule and the form's own check come from one list.
 *
 *   node scripts/moderation-sql.mjs
 */
import { readFileSync } from 'node:fs';

const terms = JSON.parse(readFileSync(new URL('../src/lib/moderation-terms.json', import.meta.url), 'utf8'));
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const before = '(^|[^[:alnum:]])';
const after = '([^[:alnum:]]|$)';
const links = `(https?://|www\\.|t\\.me/|[a-z0-9-]+\\.(com|ru|net|org|info|xyz|top|site|online|am)(/|${after}))`;
const pattern = [
  `${before}(${terms.prefixes.map(esc).join('|')})`,
  `${before}(${terms.words.map(esc).join('|')})${after}`,
  links,
].join('|');
console.log(pattern);
