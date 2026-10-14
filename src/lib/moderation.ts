import terms from './moderation-terms.json';

/*
 * What a seller may type in the name and the note: the same list the database
 * enforces (supabase/migrations/0025), checked here first so the seller gets a
 * plain sentence instead of a failed publish.
 */
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const before = '(?<![\\p{L}\\p{N}])';
const after = '(?![\\p{L}\\p{N}])';

const PATTERN = new RegExp(
  [
    `${before}(?:${terms.prefixes.map(esc).join('|')})`,
    `${before}(?:${terms.words.map(esc).join('|')})${after}`,
    `(?:https?://|www\\.|t\\.me/|[a-z0-9-]+\\.(?:com|ru|net|org|info|xyz|top|site|online|am)(?:/|${after}))`,
  ].join('|'),
  'u',
);

export function isInappropriate(text: string): boolean {
  return PATTERN.test(text.toLowerCase());
}

export const INAPPROPRIATE_MESSAGE =
  'Տեքստում կա անթույլատրելի բառ կամ հղում։ Գրե՛ք միայն ձեր անունը և բերքի մասին տեղեկություն։';

/** The database's refusal of the same thing, recognised in an error. */
export function isModerationError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  return /inappropriate content/i.test(text);
}
