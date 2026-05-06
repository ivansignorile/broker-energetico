-- supabase/migrations/20260506000013_rls_cron_runs.sql
BEGIN;

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cron_runs_select_admin" ON cron_runs;
CREATE POLICY "cron_runs_select_admin"
  ON cron_runs FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMIT;
