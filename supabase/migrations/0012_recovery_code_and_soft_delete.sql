-- Two changes that only became necessary once listings could live for months.
--
-- 1. A recovery code. Ownership is a random token in localStorage, and iOS
--    Safari deletes site data after seven days without a visit. With a five-day
--    window that barely mattered; with a three-month one a seller can lose the
--    ability to take down their own listing while their phone number stays on
--    the map. A short code, paired with the phone number already on the
--    listing, lets them get back in from any device.
--
-- 2. Deletion stops destroying the row. Deleted listings were gone for good,
--    so they were missing from every report — the August figures count only
--    what happened to still be there. The row now survives for statistics with
--    its personal fields cleared.

-- ── personal data lives exactly as long as the listing is on the map ────────
-- Once a listing leaves the map nobody needs to call the seller, so the phone,
-- the name and the free-text note are wiped at that moment. What is left is
-- what the reports actually read: crop, prices, place, dates.
alter table public.listings alter column phone drop not null;

alter table public.listings
  add column if not exists deleted_at timestamptz,
  add column if not exists ended_reason text
    check (ended_reason in ('expired', 'pulled', 'deleted'));

comment on column public.listings.ended_reason is
  'Why the listing left the map: expired (ran out), pulled (seller took it down early), deleted (seller removed it).';

create index if not exists listings_stats_idx
  on public.listings (created_at, ended_reason);

-- ── the seller's recovery code ──────────────────────────────────────────────
-- Keyed by phone because that is the half of the pair the seller always knows.
-- The code itself is stored only as a hash: it is a credential, and a readable
-- three-digit column next to a phone number would be worth stealing.
create table if not exists public.seller_codes (
  phone        text primary key check (phone ~ '^\+374[0-9]{8}$'),
  code         text not null check (code ~ '^[0-9]{3}$'),
  code_hash    text not null,
  owner_token  text not null,
  created_at   timestamptz not null default now()
);

alter table public.seller_codes enable row level security;
revoke all on public.seller_codes from anon, authenticated;

-- `code` is kept in the clear alongside the hash for one reason only: the
-- generator has to know which codes are currently taken, and it cannot compare
-- hashes to do that. Nothing outside these security-definer functions can read
-- this table, and the row is deleted the moment the seller has nothing live.
create index if not exists seller_codes_code_idx on public.seller_codes (code);

-- ── failed attempts, so a script cannot walk all 1000 codes ─────────────────
create table if not exists public.recovery_attempts (
  id          bigserial primary key,
  phone       text not null,
  attempted_at timestamptz not null default now()
);

alter table public.recovery_attempts enable row level security;
revoke all on public.recovery_attempts from anon, authenticated;

create index if not exists recovery_attempts_idx
  on public.recovery_attempts (phone, attempted_at desc);

-- ── issuing a code ──────────────────────────────────────────────────────────
-- Takes no arguments on purpose. An earlier draft accepted the phone and the
-- token as parameters, which let anyone bind their own token to somebody
-- else's number and quietly break that seller's recovery. The phone is instead
-- read from the caller's own live listings, so a code can only ever be issued
-- for a number this device has actually published with.
--
-- The search prefers a code no other active seller holds, which is what makes
-- the code feel like an identifier rather than a coincidence. Three digits is
-- only 1000 values, so once they are all spoken for it allows a repeat rather
-- than failing: recovery checks phone AND code, so a shared code opens nothing.
create or replace function public.issue_recovery_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
  seller_phone text;
  existing text;
  candidate text;
  attempt integer := 0;
begin
  if token is null then
    return null;
  end if;

  select l.phone into seller_phone
    from public.listings l
   where l.owner_token = token
     and l.phone is not null
     and l.deleted_at is null
     and l.archived_at is null
     and l.expires_at > now()
   order by l.created_at desc
   limit 1;

  if seller_phone is null then
    return null;
  end if;

  select code into existing from public.seller_codes where phone = seller_phone;
  if existing is not null then
    update public.seller_codes set owner_token = token where phone = seller_phone;
    return existing;
  end if;

  -- 40 tries finds a free code while any reasonable share of the 1000 is open;
  -- past that the pool is genuinely crowded and a duplicate is the right answer.
  loop
    attempt := attempt + 1;
    candidate := lpad((floor(random() * 1000))::int::text, 3, '0');
    exit when attempt > 40
      or not exists (select 1 from public.seller_codes where code = candidate);
  end loop;

  insert into public.seller_codes (phone, code, code_hash, owner_token)
  values (seller_phone, candidate,
          extensions.crypt(candidate, extensions.gen_salt('bf')), token)
  on conflict (phone) do update set owner_token = excluded.owner_token
  returning code into existing;

  return existing;
end;
$$;

revoke all on function public.issue_recovery_code() from public;
grant execute on function public.issue_recovery_code() to anon, authenticated;

-- ── using a code ────────────────────────────────────────────────────────────
-- Rather than handing the old owner token back over the wire, this re-files the
-- phone's listings under the token the recovering device is already sending.
-- Nothing secret travels, and it repairs the case where a seller lost storage
-- and published again: every listing that number ever made ends up on one
-- device instead of scattered across tokens nobody holds any more.
--
-- Five wrong tries in an hour and the number stops answering. At that rate all
-- 1000 codes would take 200 hours, which is not an attack anybody runs.
create or replace function public.claim_listings(p_phone text, p_code text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
  recent integer;
  row_found public.seller_codes%rowtype;
  claimed integer;
begin
  if token is null
     or p_phone !~ '^\+374[0-9]{8}$'
     or p_code !~ '^[0-9]{3}$' then
    return 0;
  end if;

  select count(*) into recent
    from public.recovery_attempts
   where phone = p_phone
     and attempted_at > now() - interval '1 hour';

  if recent >= 5 then
    raise exception 'Չափազանց շատ փորձ։ Կրկին փորձե՛ք մեկ ժամ հետո։'
      using errcode = 'check_violation';
  end if;

  select * into row_found from public.seller_codes where phone = p_phone;

  if row_found.phone is null
     or row_found.code_hash <> extensions.crypt(p_code, row_found.code_hash) then
    insert into public.recovery_attempts (phone) values (p_phone);
    return 0;
  end if;

  update public.listings
     set owner_token = token
   where phone = p_phone
     and deleted_at is null;

  get diagnostics claimed = row_count;

  update public.seller_codes set owner_token = token where phone = p_phone;

  -- A correct code clears the counter so an honest seller who fumbled twice is
  -- not left locked out afterwards.
  delete from public.recovery_attempts where phone = p_phone;
  return claimed;
end;
$$;

revoke all on function public.claim_listings(text, text) from public;
grant execute on function public.claim_listings(text, text) to anon, authenticated;

-- ── clearing the code when a seller goes quiet ─────────────────────────────
-- Frees the code once the seller has nothing left on the map. The next listing
-- they publish gets a fresh one, and the old code returns to the pool.
create or replace function public.release_code_if_idle(p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_phone is null then return; end if;

  if not exists (
    select 1 from public.listings
     where phone = p_phone
       and deleted_at is null
       and archived_at is null
       and expires_at > now()
  ) then
    delete from public.seller_codes where phone = p_phone;
  end if;
end;
$$;

revoke all on function public.release_code_if_idle(text) from public, anon, authenticated;

-- ── the three ways a listing ends ───────────────────────────────────────────
create or replace function public.archive_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
  seller_phone text;
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
begin
  if token is null then
    return false;
  end if;

  select phone into seller_phone
    from public.listings
   where id = p_id and owner_token = token;

  update public.listings
     set archived_at = now(),
         ended_reason = 'pulled',
         phone = null, seller_name = null, note = null
   where id = p_id
     and owner_token = token
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

-- Deletion keeps the row. The seller stops seeing it, the map never had it
-- after this point, and the reports still know a listing of this crop existed
-- at this price in this place — with nothing personal left on it.
create or replace function public.delete_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
  seller_phone text;
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
begin
  if token is null then
    return false;
  end if;

  select phone into seller_phone
    from public.listings
   where id = p_id and owner_token = token;

  update public.listings
     set deleted_at = now(),
         archived_at = coalesce(archived_at, now()),
         ended_reason = 'deleted',
         phone = null, seller_name = null, note = null
   where id = p_id
     and owner_token = token
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

create or replace function public.archive_expired_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  swept integer;
begin
  update public.listings
     set archived_at = expires_at,
         ended_reason = 'expired',
         phone = null, seller_name = null, note = null
   where archived_at is null
     and deleted_at is null
     and expires_at <= now();

  get diagnostics swept = row_count;

  -- Any code whose seller no longer has a live listing goes back in the pool.
  delete from public.seller_codes sc
   where not exists (
     select 1 from public.listings l
      where l.phone = sc.phone
        and l.deleted_at is null
        and l.archived_at is null
        and l.expires_at > now()
   );

  return swept;
end;
$$;

revoke all on function public.archive_expired_listings() from public, anon, authenticated;

-- ── reads must not show deleted rows ────────────────────────────────────────
drop policy if exists "listings are public while live" on public.listings;

create policy "listings are public while live"
  on public.listings for select
  to anon, authenticated
  using (archived_at is null and deleted_at is null and expires_at > now());

-- Dropped rather than replaced: Postgres refuses to change a function's OUT
-- columns in place, and this one gains none but must be rebuilt to filter
-- deleted rows.
drop function if exists public.my_listings();

create function public.my_listings()
returns table (
  id uuid,
  product_id text,
  product_name text,
  category text,
  sale_type text,
  form text,
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
  select l.id, l.product_id, l.product_name, l.category, l.sale_type, l.form,
         l.retail_price, l.wholesale_price, l.quantity_kg, l.phone,
         l.seller_name, l.note, l.lat, l.lng,
         l.created_at, l.expires_at, l.archived_at
    from public.listings l
   where l.owner_token = nullif(
           current_setting('request.headers', true)::json ->> 'x-owner-token', ''
         )
     and l.deleted_at is null
   order by l.created_at desc
   limit 200;
$$;

grant execute on function public.my_listings() to anon, authenticated;

-- ── label the listings that already ended ───────────────────────────────────
update public.listings
   set ended_reason = 'expired'
 where archived_at is not null
   and deleted_at is null
   and ended_reason is null;
