-- What the platform could not answer about itself.
--
-- Supabase's request logs keep 24 hours, and they only ever showed that a
-- browser fetched listings. Whether that person arrived as a buyer or a
-- seller, whether they opened an offer, and whether they ever pressed the call
-- button — the one moment where the platform actually does its job — left no
-- trace anywhere. This table records exactly those four moments and nothing
-- else.
--
-- Deliberately not personal data, so nobody has to be asked for permission and
-- no consent banner appears:
--
--   • no IP address, no phone number, no name, no coordinates
--   • the session id is random and lives in sessionStorage, so it dies when the
--     tab closes and cannot follow anyone between visits or across sites
--   • the visitor's region is stored only as a marz name, and only when the app
--     already knows where they are because they asked it to find them
--
-- Writes are the only thing the public may do here. A competitor reading how
-- the platform is doing is not part of the deal.
create table if not exists public.events (
  id            bigserial primary key,
  at            timestamptz not null default now(),

  -- Random, per browser session. Counts sessions, never people.
  session_id    text not null check (char_length(session_id) between 8 and 64),

  kind          text not null check (kind in ('visit', 'role', 'listing_open', 'call_click')),

  -- Which side of the market the visitor said they were on.
  role          text check (role in ('buyer', 'seller')),

  device        text check (device in ('phone', 'computer')),

  -- Where the visitor is, at marz resolution, when the app already knows.
  visitor_marz  text check (char_length(visitor_marz) <= 40),

  -- Where the produce is, for listing_open and call_click. This is the region
  -- question that matters commercially: whose crop is getting phoned about.
  listing_marz  text check (char_length(listing_marz) <= 40),
  product_id    text check (char_length(product_id) <= 40)
);

create index if not exists events_at_idx on public.events (at desc);
create index if not exists events_kind_idx on public.events (kind, at desc);
create index if not exists events_session_idx on public.events (session_id);

alter table public.events enable row level security;

revoke all on public.events from anon, authenticated;
grant insert (session_id, kind, role, device, visitor_marz, listing_marz, product_id)
  on public.events to anon, authenticated;
grant usage, select on sequence public.events_id_seq to anon, authenticated;

-- Insert only, and only rows shaped the way the app writes them. There is no
-- select policy at all, so the public can add to this table and never read it.
create policy "anyone may record an event"
  on public.events for insert
  to anon, authenticated
  with check (true);
