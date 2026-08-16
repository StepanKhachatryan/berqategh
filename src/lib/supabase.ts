import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const OWNER_TOKEN_KEY = 'berqategh.ownerToken';

/**
 * There are no accounts in the MVP. Each browser mints a random token once and
 * sends it on every request; RLS uses it to decide which listings that device
 * may edit, delete, or still see after they expire.
 */
export function ownerToken(): string {
  let token = localStorage.getItem(OWNER_TOKEN_KEY);
  if (!token) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(OWNER_TOKEN_KEY, token);
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
