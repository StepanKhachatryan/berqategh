-- 24 hours turned out to be too short a window for a farmer to be reached.
--
-- Nothing in this migration deletes a row. The only data change extends
-- listings that are currently live, which can never remove one from the map:
-- an expires_at that moves further into the future keeps a listing visible for
-- longer, never shorter. Archived and already-expired rows are left exactly as
-- they are, so history stays truthful about the window each listing actually ran.
alter table public.listings
  alter column expires_at set default now() + interval '48 hours';

update public.listings
   set expires_at = created_at + interval '48 hours'
 where archived_at is null
   and expires_at > now();

-- Dried fruit (չիր) is the same crop in a different form, not a separate
-- product: an apricot and a dried apricot share a name, a colour and a season.
-- A flag keeps the catalogue from doubling in size and lets buyers filter on it.
alter table public.listings
  add column if not exists form text not null default 'fresh'
    check (form in ('fresh', 'dried'));

-- SELECT is granted column by column since owner_token was locked away in 0004,
-- so a new column stays invisible to the browser until it is named here.
grant select (form) on public.listings to anon, authenticated;

-- my_listings() returns an explicit column list, so adding a column changes its
-- return type and Postgres requires the old one to be dropped first.
drop function if exists public.my_listings();

create function public.my_listings()
returns table (
  id uuid,
  product_id text,
  product_name text,
  category text,
  sale_type text,
  form text,
  retail_price integer,
  wholesale_price integer,
  quantity_kg numeric,
  phone text,
  seller_name text,
  note text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  expires_at timestamptz,
  archived_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.product_id, l.product_name, l.category, l.sale_type, l.form,
         l.retail_price, l.wholesale_price, l.quantity_kg, l.phone,
         l.seller_name, l.note, l.lat, l.lng,
         l.created_at, l.expires_at, l.archived_at
    from public.listings l
   where l.owner_token = nullif(
           current_setting('request.headers', true)::json ->> 'x-owner-token', ''
         )
   order by l.created_at desc
   limit 200;
$$;

grant execute on function public.my_listings() to anon, authenticated;
