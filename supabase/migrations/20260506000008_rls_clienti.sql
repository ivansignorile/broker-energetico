-- supabase/migrations/20260506000008_rls_clienti.sql
BEGIN;

ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clienti_select" ON clienti;
CREATE POLICY "clienti_select"
  ON clienti FOR SELECT
  TO authenticated
  USING (
    public.current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo)
    OR (
      public.current_ruolo() = 'commerciale'::ruolo
      AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "clienti_insert" ON clienti;
CREATE POLICY "clienti_insert"
  ON clienti FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo)
    OR (
      public.current_ruolo() = 'commerciale'::ruolo
      AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "clienti_update" ON clienti;
CREATE POLICY "clienti_update"
  ON clienti FOR UPDATE
  TO authenticated
  USING (
    public.current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo)
    OR (
      public.current_ruolo() = 'commerciale'::ruolo
      AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
    )
  )
  WITH CHECK (
    public.current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo)
    OR (
      public.current_ruolo() = 'commerciale'::ruolo
      AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "clienti_delete_admin" ON clienti;
CREATE POLICY "clienti_delete_admin"
  ON clienti FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
