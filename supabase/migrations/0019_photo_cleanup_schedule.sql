-- Runs the photo-cleanup Edge Function every ten minutes.
--
-- The function needs the service key to delete files, and it has it from its
-- own environment. What it needs from the caller is proof that the caller is
-- this schedule: a random key held in the vault, sent as a header, and checked
-- against the vault again by photo_cleanup_key_matches(). The key is created
-- here and never written anywhere else - not in this file, not in the
-- function's source, both of which are public.

create extension if not exists pg_net;

-- Created once; re-running this migration leaves an existing key alone.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'photo_cleanup_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'photo_cleanup_key',
      'Authenticates pg_cron to the photo-cleanup Edge Function.'
    );
  end if;
end;
$$;

create or replace function public.photo_cleanup_key_matches(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select decrypted_secret = p_key
       from vault.decrypted_secrets
      where name = 'photo_cleanup_key'),
    false
  );
$$;

revoke all on function public.photo_cleanup_key_matches(text) from public, anon, authenticated;
grant execute on function public.photo_cleanup_key_matches(text) to service_role;

-- Replaced if it exists, so the schedule is defined in exactly one place.
select cron.unschedule(jobid) from cron.job where jobname = 'photo-cleanup';

select cron.schedule(
  'photo-cleanup',
  '*/10 * * * *',
  $job$
    select net.http_post(
      url := 'https://xkcjipuabawakdcewklq.supabase.co/functions/v1/photo-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cleanup-key', (select decrypted_secret from vault.decrypted_secrets where name = 'photo_cleanup_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $job$
);
