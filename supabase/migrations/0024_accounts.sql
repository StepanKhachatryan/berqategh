-- Optional accounts: a Google sign-in that ties together the devices a seller
-- posts from.
--
-- Listings still belong to a device's random owner token, and posting still
-- needs no account at all. Signing in records "this device's token belongs to
-- this account"; from then on every device signed in to the same account sees
-- and manages the listings of all of them. Nothing changes for anyone who
-- never signs in.

-- No foreign key to auth.users: adding one waits on a lock the hosted
-- database never releases in time. A deleted user's rows simply match no one.
create table if not exists public.account_devices (
  user_id uuid not null,
  owner_token text not null,
  linked_at timestamptz not null default now(),
  primary key (user_id, owner_token)
);

-- Owner tokens are secrets: no API role may read or write this table directly.
alter table public.account_devices enable row level security;
revoke all on public.account_devices from anon, authenticated;

create index if not exists account_devices_token_idx on public.account_devices (owner_token);

-- The header's token, plus every token of the signed-in account.
create or replace function public.caller_owns(p_owner_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_owner_token = nullif(current_setting('request.headers', true)::json ->> 'x-owner-token', '')
      or (auth.uid() is not null and exists (
            select 1 from public.account_devices d
             where d.user_id = auth.uid() and d.owner_token = p_owner_token));
$$;

revoke all on function public.caller_owns(text) from public, anon, authenticated;

-- Called right after signing in: this device's token joins the account.
create or replace function public.link_device()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  token text := nullif(current_setting('request.headers', true)::json ->> 'x-owner-token', '');
begin
  if auth.uid() is null or token is null then
    return false;
  end if;
  insert into public.account_devices (user_id, owner_token)
  values (auth.uid(), token)
  on conflict do nothing;
  return true;
end;
$$;

revoke all on function public.link_device() from public, anon;
grant execute on function public.link_device() to authenticated;

-- ── the seller's own listings, from any of their devices ────────────────────
-- my_listings keeps its shape (the published site still calls it) and only
-- learns about accounts. DROP FUNCTION hangs on the hosted database, so the
-- version with the delivery column is a new function rather than a new shape.
create or replace function public.my_listings()
returns table (
  id uuid, product_id text, product_name text, category text, sale_type text,
  form text, retail_price integer, wholesale_price integer, quantity_kg numeric,
  phone text, seller_name text, note text, lat double precision,
  lng double precision, created_at timestamptz, expires_at timestamptz,
  archived_at timestamptz, photo_status text, photo_public text
)
language sql stable security definer set search_path = public as $$
  select l.id, l.product_id, l.product_name, l.category, l.sale_type, l.form,
         l.retail_price, l.wholesale_price, l.quantity_kg, l.phone,
         l.seller_name, l.note, l.lat, l.lng,
         l.created_at, l.expires_at, l.archived_at,
         l.photo_status, l.photo_public
    from public.listings l
   where public.caller_owns(l.owner_token)
     and l.deleted_at is null
   order by l.created_at desc
   limit 200;
$$;

create or replace function public.seller_listings()
returns table (
  id uuid, product_id text, product_name text, category text, sale_type text,
  form text, retail_price integer, wholesale_price integer, quantity_kg numeric,
  phone text, seller_name text, note text, lat double precision,
  lng double precision, created_at timestamptz, expires_at timestamptz,
  archived_at timestamptz, photo_status text, photo_public text, delivery boolean
)
language sql stable security definer set search_path = public as $$
  select l.id, l.product_id, l.product_name, l.category, l.sale_type, l.form,
         l.retail_price, l.wholesale_price, l.quantity_kg, l.phone,
         l.seller_name, l.note, l.lat, l.lng,
         l.created_at, l.expires_at, l.archived_at,
         l.photo_status, l.photo_public, l.delivery
    from public.listings l
   where public.caller_owns(l.owner_token)
     and l.deleted_at is null
   order by l.created_at desc
   limit 200;
$$;

revoke all on function public.seller_listings() from public;
grant execute on function public.seller_listings() to anon, authenticated;

-- ── ending a listing, from any of the account's devices ─────────────────────
create or replace function public.archive_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
  seller_phone text;
begin
  select phone into seller_phone
    from public.listings
   where id = p_id and public.caller_owns(owner_token);

  update public.listings
     set archived_at = now(),
         ended_reason = 'pulled',
         phone = null, seller_name = null, note = null
   where id = p_id
     and public.caller_owns(owner_token)
     and archived_at is null
     and deleted_at is null;

  get diagnostics affected = row_count;
  if affected > 0 then
    perform public.release_code_if_idle(seller_phone);
  end if;
  return affected > 0;
end;
$$;

revoke all on function public.archive_listing(uuid) from public;
grant execute on function public.archive_listing(uuid) to anon, authenticated;

create or replace function public.delete_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
  seller_phone text;
begin
  select phone into seller_phone
    from public.listings
   where id = p_id and public.caller_owns(owner_token);

  update public.listings
     set deleted_at = now(),
         archived_at = coalesce(archived_at, now()),
         ended_reason = 'deleted',
         phone = null, seller_name = null, note = null
   where id = p_id
     and public.caller_owns(owner_token)
     and deleted_at is null;

  get diagnostics affected = row_count;
  if affected > 0 then
    perform public.release_code_if_idle(seller_phone);
  end if;
  return affected > 0;
end;
$$;

revoke all on function public.delete_listing(uuid) from public;
grant execute on function public.delete_listing(uuid) to anon, authenticated;
