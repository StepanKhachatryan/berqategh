-- owner_token is a bearer credential: whoever knows it may archive or delete
-- that listing. It was included in the public feed, so anyone could read every
-- seller's token straight off the API and then forge the x-owner-token header.
--
-- This migration starts closing that off. It is completed by 0004, which fixes
-- the fact that the column-level revoke below is a no-op while a table-level
-- GRANT SELECT is still in place.
revoke select (owner_token), update (owner_token) on public.listings from anon, authenticated;

-- Reads no longer need the token for anything: the public feed is live listings
-- only, and a seller's own history comes back through my_listings() below.
drop policy if exists "listings are public while live" on public.listings;

create policy "listings are public while live"
  on public.listings for select
  to anon, authenticated
  using (archived_at is null and expires_at > now());

-- A seller's own listings, live and archived. security definer so it can match
-- on owner_token without that column being readable, and it never returns the
-- token itself.
create or replace function public.my_listings()
returns table (
  id uuid,
  product_id text,
  product_name text,
  category text,
  sale_type text,
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
  select l.id, l.product_id, l.product_name, l.category, l.sale_type,
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
