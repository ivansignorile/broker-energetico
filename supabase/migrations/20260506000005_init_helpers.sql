-- supabase/migrations/20260506000005_init_helpers.sql
BEGIN;

CREATE OR REPLACE FUNCTION public.current_ruolo()
RETURNS ruolo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT ruolo FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT current_ruolo() = 'admin'::ruolo;
$$;

CREATE OR REPLACE FUNCTION public.cliente_visibile(target_cliente_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    CASE
      WHEN current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo) THEN true
      WHEN current_ruolo() = 'commerciale'::ruolo THEN
        EXISTS (
          SELECT 1 FROM clienti
          WHERE id = target_cliente_id
            AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
        )
      ELSE false
    END;
$$;

REVOKE ALL ON FUNCTION public.current_ruolo() FROM public;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.cliente_visibile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.current_ruolo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_visibile(uuid) TO authenticated;

COMMIT;
