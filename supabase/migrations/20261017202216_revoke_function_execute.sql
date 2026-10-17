/*
# Lock down internal helper functions from public API access

1. Plain-English explanation
   Three internal helper functions (used only by the database itself to
   number invoices, count invoices for the free-plan limit, and create user
   profiles at signup) were reachable through the public web API. They do
   not leak dangerous data, but they should never be callable directly.
   This migration revokes public access and allows execution only by the
   database owner and the service role.

2. Functions modified
   - `handle_new_user()` — EXECUTE revoked from anon + authenticated; granted
     to service_role.
   - `next_invoice_number(uuid)` — same restriction.
   - `count_user_invoices(uuid)` — same restriction.

3. Security
   - Removes the linter warnings about SECURITY DEFINER functions callable
     by anon/authenticated roles. Triggers still work because triggers run
     with the function owner's privileges, not via EXECUTE grants.

4. Important notes
   - Idempotent and non-destructive; safe to re-run.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.count_user_invoices(uuid) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_user_invoices(uuid) TO service_role;
