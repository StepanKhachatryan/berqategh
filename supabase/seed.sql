-- Four demo listings so a fresh environment has something on the map.
-- Safe to re-run: it clears anything it previously inserted first.
--
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Every phone number here is +374 00 00 00 00 on purpose. Demo data must never
-- carry a number that could belong to a real person — anyone trying the map
-- would be calling a stranger. The all-zero number is also unreachable and
-- visibly fake in the UI ("Զանգահարել՝ 00 00 00 00"), so nobody mistakes a
-- sample listing for a real offer. It cannot be entered through the seller
-- form either, which rejects a leading zero.
--
-- The four cover all three map symbols (round pin = retail, crate = wholesale,
-- hexagon = both) and spread across the country from Armavir to Syunik.

delete from public.listings where owner_token like 'seed-demo-listing-%';

insert into public.listings
  (owner_token, product_id, product_name, category, sale_type,
   retail_price, wholesale_price, quantity_kg, phone, seller_name, note, lat, lng,
   expires_at)
values
  -- Both channels — hexagon pin, apricot orange. Armavir.
  ('seed-demo-listing-01', 'apricot', 'Ծիրան', 'fruit', 'both',
   900, 620, 800, '+37400000000', 'Ցուցադրական տնտեսություն', 'Ցուցադրական հայտարարություն։',
   40.1553, 44.0367, now() + interval '21 hours'),

  -- Retail only — round pin, tomato red. Vedi.
  ('seed-demo-listing-02', 'tomato', 'Լոլիկ', 'vegetable', 'retail',
   450, null, 120, '+37400000000', 'Ցուցադրական ջերմոց', 'Ցուցադրական հայտարարություն։',
   39.9137, 44.7286, now() + interval '18 hours'),

  -- Wholesale only — crate pin, potato yellow. Sisian.
  ('seed-demo-listing-03', 'potato', 'Կարտոֆիլ', 'vegetable', 'wholesale',
   null, 230, 4000, '+37400000000', 'Ցուցադրական տնտեսություն', 'Ցուցադրական հայտարարություն։',
   39.5211, 46.0322, now() + interval '23 hours'),

  -- Both channels — hexagon pin, walnut brown. Ijevan.
  ('seed-demo-listing-04', 'walnut', 'Ընկույզ', 'nut', 'both',
   3200, 2600, 300, '+37400000000', 'Ցուցադրական այգի', 'Ցուցադրական հայտարարություն։',
   40.8792, 45.1486, now() + interval '22 hours');
