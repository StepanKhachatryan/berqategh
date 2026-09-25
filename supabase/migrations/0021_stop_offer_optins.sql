-- The seller form no longer asks about agricultural offers, so nothing may
-- record a new opt-in. Phone numbers stay with their listings as before.
-- Sellers who opted in earlier keep their entry and can still withdraw it
-- from «Իմ հայտարարությունները» (marketing_consent_status and
-- withdraw_marketing_consent are untouched).
revoke execute on function public.record_marketing_consent(uuid, text) from anon, authenticated;
