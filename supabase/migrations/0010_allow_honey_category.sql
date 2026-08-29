-- Beekeepers are smallholders with the same problem this platform exists for,
-- and honey is sold by the kilogram like everything else here, so it needs no
-- special handling beyond being an allowed category.
alter table public.listings
  drop constraint if exists listings_category_check;

alter table public.listings
  add constraint listings_category_check
  check (category in ('fruit', 'vegetable', 'green', 'berry', 'nut', 'honey'));
