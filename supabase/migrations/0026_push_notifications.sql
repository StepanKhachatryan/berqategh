-- Notifications (Web Push): what a person receives is what they switched on,
-- not which side of the site they are on.
--
--  * Seller alerts: "your listing leaves the map in two days", for the
--    listings posted from this phone (and, when signed in, from any phone of
--    the same account).
--  * Buyer watch: "new apricots 12 km from you", for the products and radius
--    the buyer chose. One watch per phone.
--
-- A subscription is identified by its push endpoint - a long, unguessable URL
-- the browser issues - so no account is needed for either. The VAPID key pair
-- that signs every push is generated inside the push-send Edge Function on its
-- first run: the private half goes to the vault and never leaves Supabase; the
-- public half sits in app_config for browsers to subscribe with.

-- ── subscriptions ──────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) between 20 and 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  -- The listings token of the phone that subscribed (x-owner-token header).
  owner_token text,
  seller_alerts boolean not null default false,
  -- Buyer watch: null = no watch; empty array = every product.
  watch_products text[],
  watch_lat double precision,
  watch_lng double precision,
  watch_radius_km integer check (watch_radius_km between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  failures integer not null default 0
);

create index if not exists push_subscriptions_owner_idx on public.push_subscriptions (owner_token) where seller_alerts;

-- What has been sent, so nothing is sent twice and buyers get at most a few a day.
create table if not exists public.push_log (
  endpoint text not null,
  kind text not null,
  ref text not null,
  at timestamptz not null default now(),
  primary key (endpoint, kind, ref)
);

alter table public.push_subscriptions enable row level security;
alter table public.push_log enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_log from anon, authenticated;

-- ── the browser's side ──────────────────────────────────────────────────────
create or replace function public.push_public_key()
returns text
language sql stable security definer set search_path = public as $$
  select value #>> '{}' from public.app_config where key = 'vapid_public';
$$;
revoke all on function public.push_public_key() from public;
grant execute on function public.push_public_key() to anon, authenticated;

-- Stores or refreshes a subscription. p_seller / p_watch: null leaves that
-- part as it was, so the seller switch and the buyer watch never undo each
-- other on a phone that uses both.
create or replace function public.push_save(
  p_endpoint text, p_p256dh text, p_auth text,
  p_seller boolean default null,
  p_watch boolean default null,
  p_products text[] default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km integer default null
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  token text := nullif(current_setting('request.headers', true)::json ->> 'x-owner-token', '');
begin
  insert into public.push_subscriptions (endpoint, p256dh, auth, owner_token)
  values (p_endpoint, p_p256dh, p_auth, token)
  on conflict (endpoint) do update
     set p256dh = excluded.p256dh,
         auth = excluded.auth,
         owner_token = coalesce(excluded.owner_token, push_subscriptions.owner_token),
         failures = 0,
         updated_at = now();

  if p_seller is not null then
    update public.push_subscriptions set seller_alerts = p_seller where endpoint = p_endpoint;
  end if;

  if p_watch is true then
    update public.push_subscriptions
       set watch_products = coalesce(p_products, '{}'),
           watch_lat = p_lat, watch_lng = p_lng,
           watch_radius_km = case when p_lat is null then null else p_radius_km end
     where endpoint = p_endpoint;
  elsif p_watch is false then
    update public.push_subscriptions
       set watch_products = null, watch_lat = null, watch_lng = null, watch_radius_km = null
     where endpoint = p_endpoint;
  end if;
  return true;
end;
$$;
revoke all on function public.push_save(text, text, text, boolean, boolean, text[], double precision, double precision, integer) from public;
grant execute on function public.push_save(text, text, text, boolean, boolean, text[], double precision, double precision, integer) to anon, authenticated;

create or replace function public.push_status(p_endpoint text)
returns table (seller_alerts boolean, watch_products text[], watch_radius_km integer, watch_has_point boolean)
language sql stable security definer set search_path = public as $$
  select s.seller_alerts, s.watch_products, s.watch_radius_km, s.watch_lat is not null
    from public.push_subscriptions s where s.endpoint = p_endpoint;
$$;
revoke all on function public.push_status(text) from public;
grant execute on function public.push_status(text) to anon, authenticated;

-- ── the sender's side (push-send Edge Function, service role only) ─────────
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'push_job_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'push_job_key',
      'Authenticates the database (cron, triggers) to the push-send Edge Function.'
    );
  end if;
end;
$$;

create or replace function public.push_job_key_matches(p_key text)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select decrypted_secret = p_key from vault.decrypted_secrets where name = 'push_job_key'), false);
$$;

create or replace function public.push_vapid()
returns table (public_key text, private_key text)
language sql stable security definer set search_path = public as $$
  select (select value #>> '{}' from public.app_config where key = 'vapid_public'),
         (select decrypted_secret from vault.decrypted_secrets where name = 'push_vapid_private');
$$;

-- Called once, by the function, with the pair it generated.
create or replace function public.push_store_vapid(p_public text, p_private text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from vault.secrets where name = 'push_vapid_private') then
    return false;
  end if;
  perform vault.create_secret(p_private, 'push_vapid_private', 'VAPID private key for Web Push.');
  insert into public.app_config (key, value) values ('vapid_public', to_jsonb(p_public))
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return true;
end;
$$;

-- Listings leaving the map within two days, for phones that asked.
create or replace function public.push_due_expiring()
returns table (endpoint text, p256dh text, auth text, listing_id uuid, title text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select distinct on (s.endpoint, l.id)
         s.endpoint, s.p256dh, s.auth, l.id,
         l.product_name || case when l.form = 'dried' then ' (չիր)' else '' end,
         l.expires_at
    from public.listings l
    join public.push_subscriptions s
      on s.seller_alerts
     and (s.owner_token = l.owner_token
          or exists (select 1 from public.account_devices a
                       join public.account_devices b on b.user_id = a.user_id
                      where a.owner_token = s.owner_token and b.owner_token = l.owner_token))
   where l.archived_at is null and l.deleted_at is null
     and l.expires_at > now() and l.expires_at <= now() + interval '2 days'
     and s.failures < 5
     and not exists (select 1 from public.push_log g
                      where g.endpoint = s.endpoint and g.kind = 'expiring' and g.ref = l.id::text);
$$;

-- Phones watching for a new listing like this one, at most three a day each.
create or replace function public.push_due_new_listing(p_id uuid)
returns table (endpoint text, p256dh text, auth text, title text, price text, km integer)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth,
         l.product_name || case when l.form = 'dried' then ' (չիր)' else '' end,
         coalesce(l.retail_price, l.wholesale_price)::text,
         case when s.watch_lat is null then null
              else round(2 * 6371 * asin(sqrt(
                     power(sin(radians(l.lat - s.watch_lat) / 2), 2) +
                     cos(radians(s.watch_lat)) * cos(radians(l.lat)) *
                     power(sin(radians(l.lng - s.watch_lng) / 2), 2))))::integer end
    from public.listings l
    join public.push_subscriptions s on s.watch_products is not null
   where l.id = p_id
     and l.archived_at is null and l.deleted_at is null
     and s.failures < 5
     and (s.owner_token is distinct from l.owner_token)
     and (cardinality(s.watch_products) = 0 or l.product_id = any (s.watch_products))
     and (s.watch_lat is null or s.watch_radius_km is null or
          2 * 6371 * asin(sqrt(
            power(sin(radians(l.lat - s.watch_lat) / 2), 2) +
            cos(radians(s.watch_lat)) * cos(radians(l.lat)) *
            power(sin(radians(l.lng - s.watch_lng) / 2), 2))) <= s.watch_radius_km)
     and (select count(*) from public.push_log g
           where g.endpoint = s.endpoint and g.kind = 'new_listing' and g.at > now() - interval '1 day') < 3;
$$;

-- After each attempt: logged when delivered; a gone subscription is dropped.
create or replace function public.push_mark(p_endpoint text, p_kind text, p_ref text, p_status integer)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status in (404, 410) then
    delete from public.push_subscriptions where endpoint = p_endpoint;
  elsif p_status between 200 and 299 then
    insert into public.push_log (endpoint, kind, ref) values (p_endpoint, p_kind, p_ref) on conflict do nothing;
    update public.push_subscriptions set failures = 0 where endpoint = p_endpoint;
  else
    update public.push_subscriptions set failures = failures + 1 where endpoint = p_endpoint;
  end if;
end;
$$;

revoke all on function public.push_job_key_matches(text) from public, anon, authenticated;
revoke all on function public.push_vapid() from public, anon, authenticated;
revoke all on function public.push_store_vapid(text, text) from public, anon, authenticated;
revoke all on function public.push_due_expiring() from public, anon, authenticated;
revoke all on function public.push_due_new_listing(uuid) from public, anon, authenticated;
revoke all on function public.push_mark(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.push_job_key_matches(text) to service_role;
grant execute on function public.push_vapid() to service_role;
grant execute on function public.push_store_vapid(text, text) to service_role;
grant execute on function public.push_due_expiring() to service_role;
grant execute on function public.push_due_new_listing(uuid) to service_role;
grant execute on function public.push_mark(text, text, text, integer) to service_role;

-- ── when to send ───────────────────────────────────────────────────────────
-- A new listing: tell its watchers. pg_net queues the call and returns at
-- once, so publishing is not slowed down by it.
create or replace function public.listings_push_new()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://xkcjipuabawakdcewklq.supabase.co/functions/v1/push-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', (select decrypted_secret from vault.decrypted_secrets where name = 'push_job_key')
    ),
    body := jsonb_build_object('job', 'new_listing', 'listing_id', new.id),
    timeout_milliseconds := 20000
  );
  return new;
end;
$$;

-- (trigger created separately: see the end of this file)

-- Every morning at 09:10 Yerevan time (05:10 UTC): listings ending soon.
select cron.unschedule(jobid) from cron.job where jobname = 'push-expiring';
select cron.schedule(
  'push-expiring',
  '10 5 * * *',
  $job$
    select net.http_post(
      url := 'https://xkcjipuabawakdcewklq.supabase.co/functions/v1/push-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-key', (select decrypted_secret from vault.decrypted_secrets where name = 'push_job_key')
      ),
      body := '{"job":"expiring"}'::jsonb,
      timeout_milliseconds := 30000
    );
  $job$
);

create trigger listings_push_new
  after insert on public.listings
  for each row execute function public.listings_push_new();
