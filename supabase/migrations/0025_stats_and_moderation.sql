-- Statistics for listings and advertisers, view counts for sellers, and
-- moderation of what sellers type and upload.

-- ── events: which listing or advertiser, and which button ──────────────────
-- target: a listing id or a service id. detail: the button (call, whatsapp,
-- viber, telegram, site, facebook, yandex, google...) or a report reason.
alter table public.events add column if not exists target text check (char_length(target) <= 64);
alter table public.events add column if not exists detail text check (char_length(detail) <= 32);

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check check (kind in (
  'visit', 'role', 'listing_open', 'call_click', 'listing_directions',
  'service_open', 'service_contact', 'service_link', 'service_directions',
  'install_shown', 'install_accepted', 'install_dismissed'
));

grant insert (target, detail) on public.events to anon, authenticated;
create index if not exists events_target_idx on public.events (target, kind) where target is not null;

-- ── how many people opened and contacted each of the caller's listings ─────
-- Distinct browser sessions, so one person tapping five times counts once.
create or replace function public.listing_stats()
returns table (id uuid, views bigint, contacts bigint)
language sql stable security definer set search_path = public as $$
  select l.id,
         (select count(distinct e.session_id) from public.events e
           where e.kind = 'listing_open' and e.target = l.id::text),
         (select count(distinct e.session_id) from public.events e
           where e.kind = 'call_click' and e.target = l.id::text)
    from public.listings l
   where public.caller_owns(l.owner_token)
     and l.deleted_at is null;
$$;

revoke all on function public.listing_stats() from public;
grant execute on function public.listing_stats() to anon, authenticated;

-- ── what a seller may type ─────────────────────────────────────────────────
-- Generated from src/lib/moderation-terms.json by scripts/moderation-sql.mjs:
-- sexual and abusive words, drugs, child abuse, and links (spam), in
-- Armenian, Russian and English. The form checks the same list first, so a
-- seller sees a plain message; this is what holds when the form is bypassed.
create or replace function public.is_inappropriate(p text)
returns boolean
language sql
immutable
as $$
  select p is not null and lower(p) ~ '(^|[^[:alnum:]])(porn|xxx|nude|fuck|onlyfans|escort|cocain|heroin|marijuan|cannabis|hashish|amphetamin|mephedron|pedo|lolicon|csam|mdma|ecstas|порн|секс|интим|хуй|хуе|хуя|пизд|ебат|ебан|ебл|ёб|бляд|блят|шлюх|наркот|марихуан|гашиш|кокаин|героин|амфетамин|мефедрон|закладк|педофил|проститут|պոռնո|սեքս|ինտիմ|թմրանյութ|թմրադեղ|մանկապիղծ|մանկապղծ|պոռնիկ|մարիխուանա|կոկաին|հերոին|ամֆետամին|qunem|kunem|qunac|kunac|pornik)|(^|[^[:alnum:]])(sex|sexy|shit|bitch|dick|pussy|weed|meth|lsd|сука|спайс|բոզ|բոզի|բոզեր|քունեմ|քունած|boz|bozi)([^[:alnum:]]|$)|(https?://|www\.|t\.me/|[a-z0-9-]+\.(com|ru|net|org|info|xyz|top|site|online|am)(/|([^[:alnum:]]|$)))';
$$;

create or replace function public.listings_screen_text()
returns trigger
language plpgsql
as $$
begin
  if public.is_inappropriate(new.seller_name) or public.is_inappropriate(new.note) then
    raise exception 'inappropriate content' using errcode = 'check_violation', hint = 'moderation';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_screen_text on public.listings;
create trigger listings_screen_text
  before insert or update of seller_name, note on public.listings
  for each row execute function public.listings_screen_text();

-- ── reports from buyers ────────────────────────────────────────────────────
-- One report per listing per browser session. Sexual content or anything
-- involving children is held on the first report; anything else on the
-- second. Holding takes down only the free-form parts - name, note, photo -
-- into listing_quarantine, so the owner of the site can restore them; the
-- product, price and phone stay, so a false report costs a seller little.
-- No foreign keys: adding one to listings waits on locks the hosted database
-- does not release in time (see 0024).
create table if not exists public.listing_reports (
  listing_id uuid not null,
  session_id text not null check (char_length(session_id) between 8 and 64),
  reason text not null check (reason in ('sexual', 'child', 'drugs', 'violence', 'scam', 'other')),
  at timestamptz not null default now(),
  primary key (listing_id, session_id)
);

create table if not exists public.listing_quarantine (
  listing_id uuid primary key,
  seller_name text,
  note text,
  photo_public text,  -- the photo's storage path, kept for restoring
  photo_status text,
  held_at timestamptz not null default now(),
  released_at timestamptz
);

alter table public.listing_reports enable row level security;
alter table public.listing_quarantine enable row level security;
revoke all on public.listing_reports from anon, authenticated;
revoke all on public.listing_quarantine from anon, authenticated;

create or replace function public.report_listing(p_id uuid, p_session text, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  reports integer;
begin
  insert into public.listing_reports (listing_id, session_id, reason)
  values (p_id, p_session, p_reason)
  on conflict do nothing;

  select count(*) into reports from public.listing_reports where listing_id = p_id;

  if (p_reason in ('sexual', 'child') or reports >= 2)
     and not exists (select 1 from public.listing_quarantine where listing_id = p_id) then
    insert into public.listing_quarantine (listing_id, seller_name, note, photo_public, photo_status)
    select id, seller_name, note, photo_path, photo_status from public.listings where id = p_id;

    -- photo_public follows photo_status: anything but 'approved' hides it.
    update public.listings
       set seller_name = null,
           note = null,
           photo_status = case when photo_status = 'approved' then 'pending' else photo_status end
     where id = p_id;
  end if;
  return true;
end;
$$;

revoke all on function public.report_listing(uuid, text, text) from public;
grant execute on function public.report_listing(uuid, text, text) to anon, authenticated;

-- ── settings readable without a deploy ─────────────────────────────────────
-- 'assetlinks' is the Digital Asset Links statement that ties the Android app
-- to berqategh.am; it gets the app's signing fingerprint once Google Play has
-- issued it. Served by the assetlinks Edge Function, which Netlify proxies at
-- /.well-known/assetlinks.json.
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

insert into public.app_config (key, value) values ('assetlinks', '[]'::jsonb)
on conflict (key) do nothing;
