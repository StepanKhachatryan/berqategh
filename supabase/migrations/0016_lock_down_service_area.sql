-- The country outline is reference data, not something a visitor touches.
--
-- service_area held the polygon that decides whether a pin is inside Armenia,
-- and the anonymous role had been granted select, insert, update and delete on
-- it. Nothing was actually reachable, because row level security is on and the
-- table has no policy, so every one of those grants resolved to zero rows. But
-- that is a single careless `create policy ... using (true)` away from letting a
-- stranger redraw the border, and a grant that exists only because nothing uses
-- it is a trap for whoever touches this next.
--
-- Nothing in the browser reads this table. The only reader is
-- enforce_service_area(), the trigger that checks a new listing's coordinates,
-- and it is SECURITY DEFINER — it reads as the function's owner, not as the
-- visitor. Revoking these changes nothing about publishing a listing.

revoke all on public.service_area from anon, authenticated;

-- Said explicitly rather than left to the absence of a policy, so the intent
-- survives the next person who adds one.
comment on table public.service_area is
  'Reference geometry for the in-Armenia check. Read only by '
  'enforce_service_area() as its definer; no API role has any privilege on it.';
