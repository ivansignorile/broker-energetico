-- supabase/migrations/20260506000012_rls_notifiche_log.sql
BEGIN;

ALTER TABLE notifiche_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifiche_log_select_admin" ON notifiche_log;
CREATE POLICY "notifiche_log_select_admin"
  ON notifiche_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMIT;
