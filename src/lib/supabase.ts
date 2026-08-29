import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const OWNER_TOKEN_KEY = 'berqategh.ownerToken';

function mintToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

let token: string | null = null;

/**
 * There are no accounts in the MVP. Each browser mints a random token once and
 * sends it on every request; RLS uses it to decide which listings that device
 * may edit, delete, or still see after they expire.
 *
 * Resolved once per page load and then held in memory. That memoisation is what
 * makes publishing work, not an optimisation: the insert policy requires the
 * row's owner_token to equal the x-owner-token header, and that header is
 * frozen into the Supabase client the first time it is built. Re-reading
 * storage on every call let the two disagree — in the Facebook and Instagram
 * in-app browsers storage is routinely evicted mid-session, so a later read
 * found nothing, minted a *second* token, and every insert was rejected with
 * "new row violates row-level security policy". PostgREST reports that as a
 * bare 401, which reached the seller as a publish that simply did nothing.
 *
 * Storage is also wrapped, because a browser may refuse it outright. A token
 * that never reaches localStorage still publishes fine; the only thing lost is
 * the listing history once the tab is closed, which beats not selling at all.
 */
export function ownerToken(): string {
  if (token) return token;

  try {
    const stored = localStorage.getItem(OWNER_TOKEN_KEY);
    if (stored) {
      token = stored;
      return token;
    }
  } catch {
    // Storage unreadable — fall through and mint an in-memory token.
  }

  token = mintToken();
  try {
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  } catch {
    // Not persisted, but still valid for this session.
  }
  return token;
}

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

let client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  if (!client) {
    client = createClient<Database>(url!, anonKey!, {
      auth: { persistSession: false },
      global: { headers: { 'x-owner-token': ownerToken() } },
    });
  }
  return client;
}
