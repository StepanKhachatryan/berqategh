-- Two additions to a listing.
--
-- delivery: the seller ticked "I can also deliver". Buyers see it beside the
-- distance, so a far-away listing does not put them off.
--
-- grain: a new category for wheat, barley, oats and the other grains grown in
-- Armenia.

alter table public.listings
  add column if not exists delivery boolean not null default false;

grant select (delivery) on public.listings to anon, authenticated;

alter table public.listings
  drop constraint if exists listings_category_check;

alter table public.listings
  add constraint listings_category_check
  check (category in ('fruit', 'vegetable', 'green', 'berry', 'nut', 'tropical', 'honey', 'grain'));
