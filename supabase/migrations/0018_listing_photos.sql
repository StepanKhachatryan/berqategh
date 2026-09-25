-- One optional photograph per listing, shown to buyers only after review.
--
-- The phone does the heavy lifting before anything is sent: it decodes the
-- picture (which is what proves it is a picture), shrinks it, stamps the
-- ԲերքաՏեղ mark in the corner and encodes a JPEG of at most 500 KB. A 15 MB
-- camera original never leaves the phone. The bucket enforces the same two
-- rules on its own - JPEG only, 500 KB at most - so a client that skips the
-- conversion is refused rather than trusted.
--
-- Nobody can upload just because the key is public. A seller asks for a
-- ticket against a listing they own, proven by the same device-token header
-- that already guards archiving and deleting, and gets back one random path.
-- Storage accepts a file at that exact path, once, within fifteen minutes, and
-- nowhere else. There is no way to write over a photo, list the bucket, or
-- upload a second one.
--
-- Nothing is shown until the site owner has looked at it. Buyers read the
-- photo through photo_public, which stays empty until approve_photo() is run;
-- reject_photo() hides it for good, and the photo-cleanup function deletes the
-- file itself, along with every photo whose listing has ended.

-- ── the bucket ───────────────────────────────────────────────────────────────
-- Public, so an approved photo is served straight from the CDN. "Public" means
-- readable by exact URL only: with no select policy on storage.objects the
-- bucket cannot be listed, so a photo awaiting review cannot be found by
-- anyone who was not given its random path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 512000, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── the listing's photo ──────────────────────────────────────────────────────
alter table public.listings
  add column if not exists photo_path text,
  add column if not exists photo_status text
    check (photo_status in ('uploading', 'pending', 'approved', 'rejected')),
  add column if not exists photo_requested_at timestamptz;

-- What buyers can read: the path, only once approved. A generated column
-- rather than a policy, because what the public may see is decided per
-- column here, and this way the rule lives in one expression.
alter table public.listings
  add column if not exists photo_public text
    generated always as (case when photo_status = 'approved' then photo_path end) stored;

grant select (photo_public) on public.listings to anon, authenticated;

create index if not exists listings_photo_path_idx
  on public.listings (photo_path) where photo_path is not null;

-- ── asking to upload ─────────────────────────────────────────────────────────
-- One photo per listing: a listing that already has one, in any state but
-- rejected-and-removed, gets nothing.
create or replace function public.start_photo_upload(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
  path text;
begin
  if token is null then
    return null;
  end if;

  path := p_listing_id::text || '/' || extensions.gen_random_uuid()::text || '.jpg';

  update public.listings
     set photo_path = path,
         photo_status = 'uploading',
         photo_requested_at = now()
   where id = p_listing_id
     and owner_token = token
     and archived_at is null
     and deleted_at is null
     and expires_at > now()
     and photo_path is null;

  if not found then
    return null;
  end if;
  return path;
end;
$$;

-- Read by the storage policy below. Security definer because the policy runs
-- as the visitor, who has no right to read photo_path.
create or replace function public.photo_upload_expected(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listings
     where photo_path = p_name
       and photo_status = 'uploading'
       and photo_requested_at > now() - interval '15 minutes'
  );
$$;

drop policy if exists "listing photo uploads by ticket" on storage.objects;
create policy "listing photo uploads by ticket"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'listing-photos'
    and public.photo_upload_expected(name)
  );

-- ── done uploading ───────────────────────────────────────────────────────────
-- Moves the photo to the review queue, once the file is really there.
create or replace function public.finish_photo_upload(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
begin
  if token is null then
    return false;
  end if;

  update public.listings l
     set photo_status = 'pending'
   where l.id = p_listing_id
     and l.owner_token = token
     and l.photo_status = 'uploading'
     and exists (
       select 1 from storage.objects o
        where o.bucket_id = 'listing-photos' and o.name = l.photo_path
     );

  return found;
end;
$$;

revoke all on function public.start_photo_upload(uuid) from public;
revoke all on function public.photo_upload_expected(text) from public;
revoke all on function public.finish_photo_upload(uuid) from public;
grant execute on function public.start_photo_upload(uuid) to anon, authenticated;
grant execute on function public.photo_upload_expected(text) to anon, authenticated;
grant execute on function public.finish_photo_upload(uuid) to anon, authenticated;

-- ── the seller sees where their photo stands ─────────────────────────────────
drop function if exists public.my_listings();
create function public.my_listings()
returns table (
  id uuid, product_id text, product_name text, category text, sale_type text,
  form text, retail_price integer, wholesale_price integer, quantity_kg numeric,
  phone text, seller_name text, note text, lat double precision,
  lng double precision, created_at timestamptz, expires_at timestamptz,
  archived_at timestamptz, photo_status text, photo_public text
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.product_id, l.product_name, l.category, l.sale_type, l.form,
         l.retail_price, l.wholesale_price, l.quantity_kg, l.phone,
         l.seller_name, l.note, l.lat, l.lng,
         l.created_at, l.expires_at, l.archived_at,
         l.photo_status, l.photo_public
    from public.listings l
   where l.owner_token = nullif(
           current_setting('request.headers', true)::json ->> 'x-owner-token', ''
         )
     and l.deleted_at is null
   order by l.created_at desc
   limit 200;
$$;

revoke all on function public.my_listings() from public;
grant execute on function public.my_listings() to anon, authenticated;

-- ── review, from the dashboard ───────────────────────────────────────────────
-- Everything waiting, oldest first, with a link that opens the photo. Not
-- reachable through the API: no API role holds any privilege on it.
create or replace view public.photo_review
with (security_invoker = true) as
  select l.id as listing_id,
         l.product_name,
         l.form,
         l.created_at as listed_at,
         'https://xkcjipuabawakdcewklq.supabase.co/storage/v1/object/public/listing-photos/'
           || l.photo_path as photo_url
    from public.listings l
   where l.photo_status = 'pending'
     and l.archived_at is null
     and l.deleted_at is null
   order by l.created_at;

revoke all on public.photo_review from anon, authenticated;

comment on view public.photo_review is
  'Listing photos waiting for review. Open photo_url, then run '
  'select approve_photo(''<listing_id>'') or select reject_photo(''<listing_id>'').';

create or replace function public.approve_photo(p_listing_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.listings
     set photo_status = 'approved'
   where id = p_listing_id
     and photo_path is not null
     and photo_status in ('pending', 'rejected')
  returning true;
$$;

-- Rejecting hides the photo at once; photo-cleanup deletes the file itself
-- within minutes.
create or replace function public.reject_photo(p_listing_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.listings
     set photo_status = 'rejected'
   where id = p_listing_id and photo_status in ('pending', 'approved')
  returning true;
$$;

revoke all on function public.approve_photo(uuid) from public, anon, authenticated;
revoke all on function public.reject_photo(uuid) from public, anon, authenticated;

-- ── what the cleanup function removes ────────────────────────────────────────
-- Photos whose listing has ended or been deleted, photos that were rejected,
-- tickets never used within an hour, and any file in the bucket no listing
-- points at. Callable by the service role only - the cleanup function.
create or replace function public.photos_due_for_removal()
returns text[]
language sql
stable
security definer
set search_path = public, storage
as $$
  select coalesce(array_agg(distinct path), '{}')
    from (
      select l.photo_path as path
        from public.listings l
       where l.photo_path is not null
         and (
              l.photo_status = 'rejected'
           or l.archived_at is not null
           or l.deleted_at is not null
           or l.expires_at <= now()
           or (l.photo_status = 'uploading' and l.photo_requested_at < now() - interval '1 hour')
         )
      union
      select o.name
        from storage.objects o
       where o.bucket_id = 'listing-photos'
         and o.created_at < now() - interval '1 hour'
         and not exists (select 1 from public.listings l where l.photo_path = o.name)
    ) due;
$$;

create or replace function public.photos_removed(p_paths text[])
returns integer
language sql
security definer
set search_path = public
as $$
  -- A rejected photo stays marked rejected after its file is gone, so the
  -- seller can see why it never appeared; they may then try another.
  with cleared as (
    update public.listings
       set photo_path = null,
           photo_status = case when photo_status = 'rejected' then 'rejected' end,
           photo_requested_at = null
     where photo_path = any(p_paths)
    returning 1
  )
  select count(*)::integer from cleared;
$$;

revoke all on function public.photos_due_for_removal() from public, anon, authenticated;
revoke all on function public.photos_removed(text[]) from public, anon, authenticated;
grant execute on function public.photos_due_for_removal() to service_role;
grant execute on function public.photos_removed(text[]) to service_role;
