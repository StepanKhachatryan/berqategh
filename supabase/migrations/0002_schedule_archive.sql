-- Sweep expired listings off the map every 10 minutes.
--
-- Reads never depend on this job — the public read policy and the API layer
-- both filter on expires_at > now(), so a listing disappears from the map the
-- moment its 24h window closes. The job only moves the row into the archived
-- state so history queries and analytics have a stable flag to read.

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('archive-expired-listings');
exception when others then
  null;
end;
$$;

select cron.schedule(
  'archive-expired-listings',
  '*/10 * * * *',
  $$select public.archive_expired_listings();$$
);
