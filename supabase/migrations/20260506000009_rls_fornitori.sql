-- supabase/migrations/20260506000009_rls_fornitori.sql
BEGIN;

ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fornitori_select" ON fornitori;
CREATE POLICY "fornitori_select"
  ON fornitori FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fornitori_insert_admin" ON fornitori;
CREATE POLICY "fornitori_insert_admin"
  ON fornitori FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fornitori_update_admin" ON fornitori;
CREATE POLICY "fornitori_update_admin"
  ON fornitori FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fornitori_delete_admin" ON fornitori;
CREATE POLICY "fornitori_delete_admin"
  ON fornitori FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
