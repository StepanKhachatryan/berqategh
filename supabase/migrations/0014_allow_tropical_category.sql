-- Bananas and pineapples are not harvested in Armenia, and citrus barely is.
-- This group is therefore for traders reselling imported fruit rather than for
-- the smallholders the platform was built around — a deliberate widening, not
-- an oversight. Nothing else about a listing changes: it is still sold by the
-- kilogram, pinned to a place, and gone when its window closes.
alter table public.listings
  drop constraint if exists listings_category_check;

alter table public.listings
  add constraint listings_category_check
  check (category in ('fruit', 'vegetable', 'green', 'berry', 'nut', 'tropical', 'honey'));
