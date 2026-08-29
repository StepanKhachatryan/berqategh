-- Allow sellers to choose listing duration: 5, 10, 30, or 90 days.
-- Existing active listings are extended to 30 days.

-- 1. Extend existing active listings to 30 days.
update public.listings
   set expires_at = created_at + interval '30 days'
 where archived_at is null
   and expires_at > now();

-- 2. Change the default expiration from 5 days to 30 days.
alter table public.listings
  alter column expires_at set default now() + interval '30 days';
