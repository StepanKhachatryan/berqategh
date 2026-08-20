-- enforce_service_area() is a trigger function, but PostgREST exposed it as
-- /rest/v1/rpc/enforce_service_area, which it should never be. Triggers do not
-- need the invoking role to hold EXECUTE — that is checked when the trigger is
-- created, not when it fires — so revoking closes the endpoint while leaving
-- enforcement exactly as it was.
revoke execute on function public.enforce_service_area() from public, anon, authenticated;
