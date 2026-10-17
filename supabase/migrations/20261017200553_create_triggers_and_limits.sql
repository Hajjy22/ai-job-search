/*
# Auto-create profiles, generate invoice numbers, and enforce the free-plan limit

1. Plain-English explanation
   When someone signs up, a profile row is created for them automatically.
   New invoices get a sequential number (INV-0001, INV-0002, ...) without
   the user having to pick one. Free-plan users are limited to 3 invoices —
   the limit is enforced inside the database so it cannot be bypassed from
   the browser. Marking an invoice as paid records the payment date.

2. Functions and triggers created
   - `handle_new_user()` — trigger function on auth.users; inserts a
     matching row into `profiles` with the email from the auth record.
   - `set_invoice_number()` — before-insert trigger on `invoices`;
     assigns the next invoice number per user (INV-0001, ...) if not given.
   - `enforce_invoice_limit()` — before-insert trigger on `invoices`;
     blocks creating a 4th+ invoice for users on the 'free' plan with a
     clear error message. Pro users are unlimited.
   - `set_paid_at()` — before-update trigger on `invoices`; when status
     changes to 'paid', stamps `paid_at`; when it leaves 'paid', clears it.
   - `touch_updated_at()` — keeps `updated_at` current on clients and
     invoices on every update.

3. Security
   - `handle_new_user()` is SECURITY DEFINER (required: it runs on the auth
     table during signup) with a locked, pinned search_path.
   - All other functions run with the caller's privileges and a pinned
     search_path; the limit check uses a SECURITY DEFINER count so the
     per-user invoice count can be read reliably.

4. Important notes
   - Idempotent: uses CREATE OR REPLACE / DROP TRIGGER IF EXISTS, safe to
     re-run. No data is removed.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '\D', '', 'g'), '')::int), 0) + 1
  FROM public.invoices
  WHERE user_id = p_user_id AND invoice_number ~ '\d';
$$;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(public.next_invoice_number(NEW.user_id)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

CREATE OR REPLACE FUNCTION public.count_user_invoices(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.invoices WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.enforce_invoice_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  IF v_plan = 'free' THEN
    SELECT public.count_user_invoices(NEW.user_id) INTO v_count;
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Free plan limit reached: 3 invoices. Upgrade to Pro for unlimited invoices.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invoice_limit ON public.invoices;
CREATE TRIGGER trg_enforce_invoice_limit
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_limit();

CREATE OR REPLACE FUNCTION public.set_paid_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    NEW.paid_at := now();
  ELSIF NEW.status <> 'paid' AND OLD.status = 'paid' THEN
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_paid_at ON public.invoices;
CREATE TRIGGER trg_set_paid_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_paid_at();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_clients ON public.clients;
CREATE TRIGGER trg_touch_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_invoices ON public.invoices;
CREATE TRIGGER trg_touch_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
