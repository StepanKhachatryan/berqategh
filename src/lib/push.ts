import { isConfigured, supabase } from './supabase';

/**
 * Notifications, from the phone's side.
 *
 * Nothing here decides who is a buyer or a seller: a phone can have the
 * seller reminder, a buyer watch, both or neither, and each is switched on by
 * the person where it makes sense (after publishing; the bell over the
 * results). The server decides what is due - see migration 0026.
 */

export type PushSupport = 'ok' | 'denied' | 'ios-install' | 'unsupported';

export function pushSupport(): PushSupport {
  const capable =
    isConfigured && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!capable) {
    // iPhones get push only for sites added to the home screen (iOS 16.4+).
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios-install' : 'unsupported';
  }
  return Notification.permission === 'denied' ? 'denied' : 'ok';
}

/** Why it cannot be switched on, in a sentence for the person. */
export function pushUnavailableText(support: PushSupport): string | null {
  switch (support) {
    case 'denied':
      return 'Ծանուցումներն արգելված են այս բրաուզերում։ Թույլատրե՛ք դրանք կայքի կարգավորումներում և փորձե՛ք կրկին։';
    case 'ios-install':
      return 'iPhone-ում ծանուցումներն աշխատում են կայքը հիմնական էկրանին ավելացնելուց հետո (Safari → «Կիսվել» → «Ավելացնել գլխավոր էկրանին»)։';
    case 'unsupported':
      return 'Այս բրաուզերը ծանուցումներ չի ընդունում։ Բացե՛ք կայքը Chrome-ով կամ տեղադրե՛ք ԲերքաՏեղ app-ը։';
    default:
      return null;
  }
}

export class PushError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new PushError('timeout')), ms)),
  ]);
}

function keyBytes(base64url: string): Uint8Array {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Asks for permission (once) and subscribes this phone. */
async function ensureSubscription(): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new PushError('denied');

  const registration = await withTimeout(navigator.serviceWorker.ready, 10_000);
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const { data: publicKey, error } = await supabase().rpc('push_public_key');
  if (error || !publicKey) throw new PushError('no key');
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes(publicKey) as BufferSource,
  });
}

function identity(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    p_endpoint: json.endpoint ?? subscription.endpoint,
    p_p256dh: json.keys?.p256dh ?? '',
    p_auth: json.keys?.auth ?? '',
  };
}

export interface PushStatus {
  seller: boolean;
  /** Null when there is no buyer watch. Empty products = every product. */
  watch: { products: string[]; radiusKm: number | null; hasPoint: boolean } | null;
}

export async function pushStatus(): Promise<PushStatus> {
  const subscription = await currentSubscription().catch(() => null);
  if (!subscription) return { seller: false, watch: null };
  const { data } = await supabase().rpc('push_status', { p_endpoint: subscription.endpoint });
  const row = data?.[0];
  if (!row) return { seller: false, watch: null };
  return {
    seller: row.seller_alerts,
    watch: row.watch_products
      ? { products: row.watch_products, radiusKm: row.watch_radius_km, hasPoint: row.watch_has_point }
      : null,
  };
}

/** The seller's reminder before a listing leaves the map. */
export async function setSellerAlerts(on: boolean): Promise<void> {
  const subscription = on ? await ensureSubscription() : await currentSubscription();
  if (!subscription) return;
  const { error } = await supabase().rpc('push_save', { ...identity(subscription), p_seller: on });
  if (error) throw new PushError(error.message);
}

export interface WatchSettings {
  /** Empty = every product. */
  products: string[];
  /** Null point = the whole of Armenia. */
  point: { lat: number; lng: number } | null;
  radiusKm: number | null;
}

/** The buyer's watch for new listings; null switches it off. */
export async function setWatch(settings: WatchSettings | null): Promise<void> {
  const subscription = settings ? await ensureSubscription() : await currentSubscription();
  if (!subscription) return;
  const { error } = await supabase().rpc('push_save', {
    ...identity(subscription),
    p_watch: settings !== null,
    p_products: settings?.products ?? null,
    p_lat: settings?.point?.lat ?? null,
    p_lng: settings?.point?.lng ?? null,
    p_radius_km: settings?.point ? settings.radiusKm : null,
  });
  if (error) throw new PushError(error.message);
}

/** A friendly sentence for a failure. */
export function pushErrorText(error: unknown): string {
  if (error instanceof PushError && error.message === 'denied') {
    return 'Ծանուցումները թույլատրված չեն։ Եթե սխալմամբ եք մերժել, թույլատրե՛ք դրանք կայքի կարգավորումներում։';
  }
  return 'Չհաջողվեց միացնել ծանուցումները։ Փորձե՛ք կրկին։';
}
