-- Sellers who agree to hear from agricultural services, and what they grow.
--
-- Until now a seller's phone number lived exactly as long as their listing was
-- on the map, and was wiped the moment it left (see 0012). That was the whole
-- promise: the number is on the site so buyers can call about this harvest,
-- and for nothing else.
--
-- Targeted offers - seed and chemicals for the people who grow apricots in
-- Ararat - need the number to outlive the listing and to be used for a second
-- purpose. Armenia's law on personal data does not allow a number collected
-- for one purpose to be kept and used for another without the person's
-- consent, and its law on advertising requires the recipient's prior consent
-- for advertising sent by phone. So this is opt-in, per listing, recorded with
-- the version of the wording the seller agreed to.
--
-- What changes for everyone else: nothing. A seller who does not tick the box
-- has their number wiped when the listing ends, as before.

create table if not exists public.marketing_contacts (
  phone           text not null check (phone ~ '^\+374[0-9]{8}$'),
  product_id      text not null,
  category        text not null,
  form            text not null default 'fresh',
  -- Where the harvest was, copied from the listing, which already showed it on
  -- a public map. Enough to target by marz without keeping anything finer.
  lat             double precision not null,
  lng             double precision not null,
  -- The device that gave consent, so it can also withdraw it.
  owner_token     text not null,
  consented_at    timestamptz not null default now(),
  last_listed_at  timestamptz not null default now(),
  -- Which wording was on screen when the box was ticked. The text itself lives
  -- in the app (CONSENT_VERSION in src/lib/marketing.ts); change both together.
  consent_version text not null check (char_length(consent_version) between 1 and 32),

  primary key (phone, product_id, form)
);

comment on table public.marketing_contacts is
  'Sellers who opted in to agricultural offers, with the crops they listed. '
  'Written only by record_marketing_consent() from the caller''s own listing; '
  'no API role can read or write it directly. Read from the dashboard.';

create index if not exists marketing_contacts_product_idx
  on public.marketing_contacts (product_id);
create index if not exists marketing_contacts_owner_idx
  on public.marketing_contacts (owner_token);

-- The site's public key ships in every browser and the repository is public.
-- A table of farmers' phone numbers readable with that key would be a gift to
-- every spammer in the country, so nothing an API role holds reaches it.
alter table public.marketing_contacts enable row level security;
revoke all on public.marketing_contacts from anon, authenticated;

-- ── recording consent ───────────────────────────────────────────────────────
-- Takes a listing id, not a phone number. The number, crop and place are read
-- from the caller's own listing, so this cannot be used to sign up a number
-- the caller has not just published under their own device token - nobody can
-- enrol a neighbour's phone by typing it in.
create or replace function public.record_marketing_consent(p_listing_id uuid, p_version text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
  l public.listings%rowtype;
begin
  if token is null or p_version is null or char_length(p_version) not between 1 and 32 then
    return false;
  end if;

  select * into l
    from public.listings
   where id = p_listing_id
     and owner_token = token
     and phone is not null
     and deleted_at is null;

  if not found then
    return false;
  end if;

  insert into public.marketing_contacts
    (phone, product_id, category, form, lat, lng, owner_token, consent_version)
  values
    (l.phone, l.product_id, l.category, coalesce(l.form, 'fresh'), l.lat, l.lng, token, p_version)
  on conflict (phone, product_id, form) do update
    set category        = excluded.category,
        lat             = excluded.lat,
        lng             = excluded.lng,
        owner_token     = excluded.owner_token,
        consent_version = excluded.consent_version,
        consented_at    = now(),
        last_listed_at  = now();

  return true;
end;
$$;

-- ── is this device's seller on the list ─────────────────────────────────────
-- Matched by device token and by the phone on any of the caller's live
-- listings, so a seller who recovered their listings onto a new phone still
-- sees - and can withdraw - consent they gave on the old one.
create or replace function public.marketing_consent_status()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
begin
  if token is null then
    return false;
  end if;

  return exists (
    select 1 from public.marketing_contacts mc
     where mc.owner_token = token
        or mc.phone in (
             select l.phone from public.listings l
              where l.owner_token = token and l.phone is not null
           )
  );
end;
$$;

-- ── withdrawing consent ─────────────────────────────────────────────────────
-- Deletes every row for this seller, not just the ones from this device:
-- withdrawing means the number is gone, all crops at once.
create or replace function public.withdraw_marketing_consent()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  token text := nullif(
    current_setting('request.headers', true)::json ->> 'x-owner-token', ''
  );
  removed integer;
begin
  if token is null then
    return 0;
  end if;

  delete from public.marketing_contacts mc
   where mc.phone in (
           select m2.phone from public.marketing_contacts m2 where m2.owner_token = token
           union
           select l.phone from public.listings l
            where l.owner_token = token and l.phone is not null
         );

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.record_marketing_consent(uuid, text) from public;
revoke all on function public.marketing_consent_status() from public;
revoke all on function public.withdraw_marketing_consent() from public;

grant execute on function public.record_marketing_consent(uuid, text) to anon, authenticated;
grant execute on function public.marketing_consent_status() to anon, authenticated;
grant execute on function public.withdraw_marketing_consent() to anon, authenticated;
