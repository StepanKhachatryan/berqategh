-- A table-level GRANT SELECT covers every column, so the column-level revoke in
-- 0003 had no effect. The privilege has to be dropped at the table level and
-- re-granted per column, leaving owner_token out.
revoke select, update on public.listings from anon, authenticated;

grant select (
  id, product_id, product_name, category, sale_type,
  retail_price, wholesale_price, quantity_kg, phone, seller_name, note,
  lat, lng, created_at, expires_at, archived_at
) on public.listings to anon, authenticated;

-- Sellers only ever change one field from the client: pulling a listing off the
-- map early. Everything else, including reassigning ownership, stays read-only.
-- (0005 removes even this, once archiving moves behind an RPC.)
grant update (archived_at) on public.listings to anon, authenticated;
