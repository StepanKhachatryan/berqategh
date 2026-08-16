-- Same interaction as archiving: Postgres enforces SELECT policies on the rows a
-- DELETE reads, so once a listing is archived it becomes invisible to the public
-- read policy and its own seller could no longer delete it. Deletion joins
-- archiving behind an RPC, leaving INSERT as the only direct write a client has.
--
-- Final client-facing surface on public.listings:
--   SELECT  — live listings only, every column except owner_token
--   INSERT  — only with the caller's own owner_token
--   UPDATE  — revoked
--   DELETE  — revoked
--   RPCs    — my_listings(), archive_listing(id), delete_listing(id)
revoke delete on public.listings from anon, authenticated;

drop policy if exists "sellers may delete their own listings" on public.listings;

create or replace function public.delete_listing(p_id uuid)
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

  delete from public.listings
   where id = p_id
     and owner_token = token;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function public.delete_listing(uuid) to anon, authenticated;
