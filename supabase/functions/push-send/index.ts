// Sends ԲերքաՏեղ's Web Push notifications.
//
// Called only by the database: the morning cron job ("expiring") and the
// trigger on new listings ("new_listing"), both of which send a key kept in
// the vault (push_job_key) - knowing this URL is not enough to send anything.
// What is due, and to whom, is decided in SQL (push_due_* in migration 0026);
// this only signs, encrypts and delivers.
//
// The VAPID key pair is generated here on the first run. The private half is
// stored in the vault and never leaves Supabase; the public half goes to
// app_config, where browsers read it to subscribe.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUBJECT = 'https://berqategh.am';

type Db = ReturnType<typeof createClient>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function b64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function vapidKeys(db: Db): Promise<{ public_key: string; private_key: string }> {
  const { data } = await db.rpc('push_vapid').single<{ public_key: string | null; private_key: string | null }>();
  if (data?.public_key && data?.private_key) return data as { public_key: string; private_key: string };

  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  await db.rpc('push_store_vapid', { p_public: publicKey, p_private: jwk.d });
  // Read back: if two runs raced, the first pair stored is the one in use.
  const { data: stored } = await db.rpc('push_vapid').single<{ public_key: string; private_key: string }>();
  return stored!;
}

interface Target {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function send(db: Db, target: Target, kind: string, ref: string, payload: object, ttl: number) {
  let status = 0;
  try {
    const result = await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: ttl, urgency: 'normal' },
    );
    status = result.statusCode;
  } catch (error) {
    status = (error as { statusCode?: number }).statusCode ?? 0;
  }
  await db.rpc('push_mark', { p_endpoint: target.endpoint, p_kind: kind, p_ref: ref, p_status: status });
  return status;
}

Deno.serve(async (req: Request) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const key = req.headers.get('x-push-key') ?? '';
  const { data: allowed } = await db.rpc('push_job_key_matches', { p_key: key });
  if (!allowed) return json({ error: 'forbidden' }, 403);

  const body = await req.json().catch(() => ({}));
  const keys = await vapidKeys(db);
  webpush.setVapidDetails(SUBJECT, keys.public_key, keys.private_key);

  if (body.job === 'init') return json({ public_key: keys.public_key });

  if (body.job === 'expiring') {
    const { data: due } = await db.rpc('push_due_expiring');
    const statuses: number[] = [];
    for (const row of (due ?? []) as (Target & { listing_id: string; title: string; expires_at: string })[]) {
      const hours = (new Date(row.expires_at).getTime() - Date.now()) / 3_600_000;
      const when = hours <= 24 ? 'վաղը' : '2 օրից';
      statuses.push(
        await send(db, row, 'expiring', row.listing_id, {
          title: `Ժամկետը լրանում է՝ ${row.title}`,
          body: `Հայտարարությունը քարտեզից կհանվի ${when}։ Եթե դեռ վաճառում եք, տեղադրեք այն նորից։`,
          url: '/?open=mine',
          tag: `expiring-${row.listing_id}`,
        }, 24 * 3600),
      );
    }
    return json({ sent: statuses.length, statuses });
  }

  if (body.job === 'new_listing' && body.listing_id) {
    const { data: due } = await db.rpc('push_due_new_listing', { p_id: body.listing_id });
    const statuses: number[] = [];
    for (const row of (due ?? []) as (Target & { title: string; price: string | null; km: number | null })[]) {
      const parts = [row.price ? `${row.price} ֏/կգ` : null, row.km !== null ? `${row.km} կմ ձեզնից` : null].filter(Boolean);
      statuses.push(
        await send(db, row, 'new_listing', String(body.listing_id), {
          title: `Նոր առաջարկ՝ ${row.title}`,
          body: `${parts.join(' · ')}${parts.length ? '։ ' : ''}Սեղմեք՝ տեսնելու համար։`,
          url: `/?listing=${body.listing_id}`,
          tag: `listing-${body.listing_id}`,
        }, 6 * 3600),
      );
    }
    return json({ sent: statuses.length, statuses });
  }

  // A test message to one phone, sent by the site's owner from SQL.
  if (body.job === 'test' && body.endpoint) {
    const { data: sub } = await db.from('push_subscriptions').select('endpoint, p256dh, auth').eq('endpoint', body.endpoint).maybeSingle();
    if (!sub) return json({ error: 'no such subscription' }, 404);
    const status = await send(db, sub as Target, 'test', String(Date.now()), {
      title: 'ԲերքաՏեղ',
      body: 'Ծանուցումները աշխատում են ✓',
      url: '/',
      tag: 'test',
    }, 3600);
    return json({ status });
  }

  return json({ error: 'unknown job' }, 400);
});
