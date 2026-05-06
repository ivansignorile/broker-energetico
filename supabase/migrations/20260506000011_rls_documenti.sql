-- supabase/migrations/20260506000011_rls_documenti.sql
BEGIN;

ALTER TABLE documenti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documenti_select" ON documenti;
CREATE POLICY "documenti_select"
  ON documenti FOR SELECT
  TO authenticated
  USING (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "documenti_insert" ON documenti;
CREATE POLICY "documenti_insert"
  ON documenti FOR INSERT
  TO authenticated
  WITH CHECK (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "documenti_update" ON documenti;
CREATE POLICY "documenti_update"
  ON documenti FOR UPDATE
  TO authenticated
  USING (public.cliente_visibile(cliente_id))
  WITH CHECK (public.cliente_visibile(cliente_id));

DROP POLICY IF EXISTS "documenti_delete_admin" ON documenti;
CREATE POLICY "documenti_delete_admin"
  ON documenti FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
