-- The RLS helpers were SECURITY DEFINER functions sitting in `public`, which
-- PostgREST exposes as /rest/v1/rpc/... to anon and authenticated alike
-- (Supabase linter 0028/0029). Revoking EXECUTE is not an option — RLS policy
-- expressions are evaluated as the querying role, so the policies would start
-- failing. Moving them to an unexposed schema removes the REST surface while
-- the policies keep working, since they depend on the function OID.

create schema if not exists private;

-- Policies follow the function through the move; no policy rewrite needed.
alter function public.is_admin() set schema private;
alter function public.admin_bootstrap_open() set schema private;

grant usage on schema private to anon, authenticated;
