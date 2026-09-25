-- Photos go live the moment they are uploaded; the site owner looks later.
--
-- Until now a photo waited as 'pending' until approve_photo() was run. The
-- owner prefers sellers see their photo straight away and to check afterwards,
-- removing anything improper with reject_photo(), which hides it at once and
-- lets photo-cleanup delete the file. Everything else - one photo per listing,
-- JPEG only, 500 KB, the ticket, the watermark - is unchanged.

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
     set photo_status = 'approved'
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

-- Anything uploaded while photos still waited for review goes live too.
update public.listings set photo_status = 'approved' where photo_status = 'pending';

-- The owner's list for checking after the fact: every photo buyers can see
-- now, newest first.
drop view if exists public.photo_review;
create view public.photo_review
with (security_invoker = true) as
  select l.id as listing_id,
         l.product_name,
         l.form,
         l.photo_requested_at as uploaded_at,
         'https://xkcjipuabawakdcewklq.supabase.co/storage/v1/object/public/listing-photos/'
           || l.photo_path as photo_url
    from public.listings l
   where l.photo_status = 'approved'
     and l.photo_path is not null
     and l.archived_at is null
     and l.deleted_at is null
     and l.expires_at > now()
   order by l.photo_requested_at desc;

revoke all on public.photo_review from anon, authenticated;

comment on view public.photo_review is
  'Listing photos buyers can see now, newest first. To take one down, run '
  'select reject_photo(''<listing_id>'').';
