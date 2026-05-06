-- supabase/migrations/20260506000010_rls_contratti.sql
BEGIN;

ALTER TABLE contratti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratti_select" ON contratti;
CREATE POLICY "contratti_select"
  ON contratti FOR SELECT
  TO authenticated
  USING (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "contratti_insert" ON contratti;
CREATE POLICY "contratti_insert"
  ON contratti FOR INSERT
  TO authenticated
  WITH CHECK (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "contratti_update" ON contratti;
CREATE POLICY "contratti_update"
  ON contratti FOR UPDATE
  TO authenticated
  USING (public.cliente_visibile(cliente_id))
  WITH CHECK (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "contratti_delete_admin" ON contratti;
CREATE POLICY "contratti_delete_admin"
  ON contratti FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
