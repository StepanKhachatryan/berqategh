-- Archiving a listing sets archived_at, which by design makes the row fail the
-- public read policy — and Postgres enforces that policy against the updated
-- row, so after 0003 a seller could no longer archive their own listing through
-- a plain UPDATE. Rather than widening the read policy again (which is what
-- exposed owner_token in the first place), archiving becomes a narrow RPC and
-- the client loses UPDATE on the table entirely.
revoke update on public.listings from anon, authenticated;

drop policy if exists "sellers may edit their own listings" on public.listings;

create or replace function public.archive_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
begin
  if token is null then
    return false;
  end if;

  update public.listings
     set archived_at = now()
   where id = p_id
     and owner_token = token
     and archived_at is null;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function public.archive_listing(uuid) to anon, authenticated;
