import { supabase, isConfigured } from './supabase';
import { marzOf } from './marz';
import type { LatLng, Role } from './types';

/**
 * Four moments in the life of a visit, recorded so the platform can say
 * something about itself: somebody arrived, they said which side of the market
 * they are on, they opened an offer, they pressed call.
 *
 * The call is the one that matters. Everything else the platform does is in
 * service of a buyer dialling a farmer, and until now that moment left no trace
 * at all — it is a plain tel: link, so nothing downstream of it is observable
 * either. Counting the press is the closest the platform can get to knowing
 * whether it works.
 *
 * Nothing here asks the visitor for anything. No banner, no prompt, no extra
 * tap, because nothing personal is collected: no IP, no name, no number, no
 * coordinates. The session id is random and lives in sessionStorage, so it is
 * gone when the tab closes and cannot join up two visits or follow anyone to
 * another site. A region is attached only when the app already knows where the
 * visitor is because they asked it to find them, and only ever as a marz name.
 */

const SESSION_KEY = 'berqategh.session';

let sessionId: string | null = null;

function currentSession(): string {
  if (sessionId) return sessionId;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    // Storage refused — an in-memory id still groups this page's events.
  }

  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  sessionId = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  try {
    sessionStorage.setItem(SESSION_KEY, sessionId);
  } catch {
    // Not persisted; fine.
  }
  return sessionId;
}

/**
 * Phone or computer, decided by input and width rather than by parsing a user
 * agent string — a touch screen under 1024px is a phone whatever the browser
 * claims to be, and agent strings lie constantly in in-app browsers.
 */
function device(): 'phone' | 'computer' {
  const touch = navigator.maxTouchPoints > 0;
  return touch && window.innerWidth < 1024 ? 'phone' : 'computer';
}

interface EventInput {
  kind:
    | 'visit'
    | 'role'
    | 'listing_open'
    | 'call_click'
    | 'install_shown'
    | 'install_accepted'
    | 'install_dismissed';
  role?: Role;
  /** The visitor's own position, if the app already has one. */
  origin?: LatLng | null;
  /** Where the produce is, for events about a specific listing. */
  listingAt?: LatLng;
  productId?: string;
}

/**
 * Fire and forget, in every sense: never awaited, never surfaced, and never
 * allowed to throw. A failed count is worth nothing next to a seller who
 * cannot publish, so analytics must not be able to break anything.
 */
export function record(input: EventInput): void {
  if (!isConfigured) return;

  try {
    const row = {
      session_id: currentSession(),
      kind: input.kind,
      role: input.role ?? null,
      device: device(),
      visitor_marz: input.origin ? marzOf(input.origin.lat, input.origin.lng) : null,
      listing_marz: input.listingAt ? marzOf(input.listingAt.lat, input.listingAt.lng) : null,
      product_id: input.productId ?? null,
    };

    void supabase()
      .from('events')
      .insert(row)
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // Analytics is never a reason for anything visible to go wrong.
  }
}

let visitRecorded = false;

/** Once per browser session, however many times the app remounts. */
export function recordVisit(origin: LatLng | null): void {
  if (visitRecorded) return;
  visitRecorded = true;
  record({ kind: 'visit', origin });
}
