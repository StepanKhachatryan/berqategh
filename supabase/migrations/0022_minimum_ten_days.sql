-- Listings run for at least 10 days; the 5-day option is gone.
--
-- The form no longer offers 5 days, but the version already on phones and on
-- the live site until the next deploy still does, and the page sets
-- expires_at itself. So the floor is enforced here, where every insert passes:
-- anything shorter than 10 days becomes 10 days from now. The 9-day threshold
-- leaves a genuine 10-day listing alone even when the phone's clock is a
-- little behind the server's.

create or replace function public.enforce_minimum_duration()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.expires_at is null or new.expires_at < now() + interval '9 days' then
    new.expires_at := now() + interval '10 days';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_minimum_duration on public.listings;
create trigger listings_minimum_duration
  before insert on public.listings
  for each row execute function public.enforce_minimum_duration();

-- Any live listing that was posted for 5 days runs 10 days from when it was
-- posted.
update public.listings
   set expires_at = created_at + interval '10 days'
 where archived_at is null
   and deleted_at is null
   and expires_at > now()
   and expires_at < created_at + interval '9 days';
