-- Demo listings across Armenia so a fresh environment has something on the map.
-- Safe to re-run: it clears anything it previously inserted first.
--
--   psql "$DATABASE_URL" -f supabase/seed.sql

delete from public.listings where owner_token like 'seed-demo-listing-%';

insert into public.listings
  (owner_token, product_id, product_name, category, sale_type,
   retail_price, wholesale_price, quantity_kg, phone, seller_name, note, lat, lng,
   expires_at)
values
  ('seed-demo-listing-01', 'apricot', 'Ծիրան', 'fruit', 'both',
   900, 620, 800, '+37493114455', 'Արամի այգի', 'Երևանյան ծիրան, հավաքված է այսօր առավոտյան։',
   40.1553, 44.0367, now() + interval '21 hours'),

  ('seed-demo-listing-02', 'tomato', 'Լոլիկ', 'vegetable', 'retail',
   450, null, 120, '+37477203040', 'Վեդու ջերմոց', 'Ջերմոցային, առանց քիմիկատների։',
   39.9137, 44.7286, now() + interval '18 hours'),

  ('seed-demo-listing-03', 'potato', 'Կարտոֆիլ', 'vegetable', 'wholesale',
   null, 230, 4000, '+37455661122', 'Սիսիանի տնտեսություն', 'Մեծածախ՝ 500 կգ-ից սկսած։',
   39.5211, 46.0322, now() + interval '23 hours'),

  ('seed-demo-listing-04', 'peach', 'Դեղձ', 'fruit', 'both',
   750, 500, 600, '+37498334455', 'Արարատյան դաշտ', null,
   39.9526, 44.5453, now() + interval '15 hours'),

  ('seed-demo-listing-05', 'grape', 'Խաղող (կարմիր)', 'fruit', 'wholesale',
   null, 400, 2500, '+37491778899', 'Արենիի այգիներ', 'Գինու խաղող, մեծ ծավալներով։',
   39.7128, 45.1719, now() + interval '20 hours'),

  ('seed-demo-listing-06', 'cucumber', 'Վարունգ', 'vegetable', 'retail',
   380, null, 90, '+37494556677', null, null,
   40.1622, 44.2911, now() + interval '11 hours'),

  ('seed-demo-listing-07', 'walnut', 'Ընկույզ', 'nut', 'both',
   3200, 2600, 300, '+37477889900', 'Իջևանի ընկուզենիներ', 'Մաքրված միջուկ։',
   40.8792, 45.1486, now() + interval '22 hours'),

  ('seed-demo-listing-08', 'cabbage', 'Կաղամբ', 'vegetable', 'wholesale',
   null, 160, 6000, '+37493220011', 'Լոռու տնտեսություն', 'Ձմեռային պահեստավորման համար։',
   40.8128, 44.4883, now() + interval '19 hours'),

  ('seed-demo-listing-09', 'strawberry', 'Ելակ', 'berry', 'retail',
   1800, null, 40, '+37455443322', 'Աշտարակի ելակ', 'Օրական հավաքվող թարմ ելակ։',
   40.2986, 44.3617, now() + interval '9 hours'),

  ('seed-demo-listing-10', 'pomegranate', 'Նուռ', 'fruit', 'both',
   1100, 780, 900, '+37498112233', 'Մեղրու այգիներ', 'Քաղցր, բարակ կեղևով։',
   38.9060, 46.2430, now() + interval '23 hours'),

  ('seed-demo-listing-11', 'basil', 'Ռեհան', 'green', 'retail',
   1200, null, 15, '+37491334455', null, 'Փնջով, օրական թարմ։',
   40.3564, 45.1264, now() + interval '7 hours'),

  ('seed-demo-listing-12', 'eggplant', 'Բադրիջան', 'vegetable', 'both',
   520, 340, 500, '+37494667788', 'Գորիսի տնտեսություն', null,
   39.5109, 46.3400, now() + interval '16 hours'),

  ('seed-demo-listing-13', 'apple', 'Խնձոր', 'fruit', 'wholesale',
   null, 280, 3500, '+37477112244', 'Տավուշի այգիներ', 'Բերքահավաքը շարունակվում է։',
   40.9500, 45.0500, now() + interval '20 hours'),

  ('seed-demo-listing-14', 'watermelon', 'Ձմերուկ', 'fruit', 'both',
   250, 170, 5000, '+37493556644', 'Արմավիրի բոստան', 'Դաշտից ուղիղ, ինքնաբեռնում։',
   40.1200, 43.9800, now() + interval '13 hours'),

  ('seed-demo-listing-15', 'corn', 'Եգիպտացորեն', 'vegetable', 'retail',
   300, null, 200, '+37455998877', null, null,
   40.2400, 44.7100, now() + interval '10 hours');
