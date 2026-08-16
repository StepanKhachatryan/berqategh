-- ԲերքաՏեղ / Berqategh — initial schema
-- A listing is an anonymous, device-owned, 24h-lived offer pinned to a map location.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.listings (
  id              uuid primary key default extensions.gen_random_uuid(),

  -- Device-scoped ownership token. No accounts in the MVP: the browser mints a
  -- random token, keeps it in localStorage and sends it as the x-owner-token
  -- header. RLS below uses it to scope updates/deletes and archive visibility.
  owner_token     text not null check (char_length(owner_token) between 16 and 128),

  product_id      text not null,
  product_name    text not null,
  category        text not null check (category in ('fruit', 'vegetable', 'green', 'berry', 'nut')),

  sale_type       text not null check (sale_type in ('retail', 'wholesale', 'both')),
  retail_price    integer check (retail_price > 0 and retail_price <= 1000000),
  wholesale_price integer check (wholesale_price > 0 and wholesale_price <= 1000000),
  quantity_kg     numeric(10, 2) check (quantity_kg > 0),

  phone           text not null check (phone ~ '^\+374[0-9]{8}$'),
  seller_name     text check (char_length(seller_name) <= 80),
  note            text check (char_length(note) <= 300),

  lat             double precision not null check (lat between 38.5 and 41.5),
  lng             double precision not null check (lng between 43.0 and 47.0),

  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '24 hours',
  archived_at     timestamptz,

  -- A price is required for every channel the seller actually sells through.
  constraint retail_price_required check (
    sale_type = 'wholesale' or retail_price is not null
  ),
  constraint wholesale_price_required check (
    sale_type = 'retail' or wholesale_price is not null
  )
);

comment on table public.listings is 'Farmer offers shown on the map. Live for 24h, then archived.';

-- The map query is always "active listings, newest first", optionally inside a
-- viewport box. These two indexes cover both shapes.
create index if not exists listings_active_idx
  on public.listings (expires_at desc)
  where archived_at is null;

create index if not exists listings_bbox_idx
  on public.listings (lat, lng)
  where archived_at is null;

create index if not exists listings_owner_idx
  on public.listings (owner_token, created_at desc);

alter table public.listings enable row level security;

-- Anyone may read a listing while it is live. A seller additionally sees their
-- own expired/archived rows, matched on the x-owner-token request header.
create policy "listings are public while live"
  on public.listings for select
  to anon, authenticated
  using (
    (archived_at is null and expires_at > now())
    or owner_token = nullif(
         current_setting('request.headers', true)::json ->> 'x-owner-token', ''
       )
  );

create policy "anyone may publish a listing"
  on public.listings for insert
  to anon, authenticated
  with check (
    owner_token = nullif(
      current_setting('request.headers', true)::json ->> 'x-owner-token', ''
    )
  );

create policy "sellers may edit their own listings"
  on public.listings for update
  to anon, authenticated
  using (
    owner_token = nullif(
      current_setting('request.headers', true)::json ->> 'x-owner-token', ''
    )
  )
  with check (
    owner_token = nullif(
      current_setting('request.headers', true)::json ->> 'x-owner-token', ''
    )
  );

create policy "sellers may delete their own listings"
  on public.listings for delete
  to anon, authenticated
  using (
    owner_token = nullif(
      current_setting('request.headers', true)::json ->> 'x-owner-token', ''
    )
  );

-- Sweeps listings whose 24h window has closed. Called by pg_cron; also safe to
-- call manually. Expired rows stay readable to their own seller as history.
create or replace function public.archive_expired_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  swept integer;
begin
  update public.listings
     set archived_at = expires_at
   where archived_at is null
     and expires_at <= now();

  get diagnostics swept = row_count;
  return swept;
end;
$$;

revoke all on function public.archive_expired_listings() from public, anon, authenticated;
