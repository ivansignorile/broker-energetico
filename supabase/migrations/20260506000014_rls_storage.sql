-- supabase/migrations/20260506000014_rls_storage.sql
BEGIN;

DROP POLICY IF EXISTS "documents_select" ON storage.objects;
CREATE POLICY "documents_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.cliente_visibile(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "documents_insert" ON storage.objects;
CREATE POLICY "documents_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.cliente_visibile(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "documents_update" ON storage.objects;
CREATE POLICY "documents_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.cliente_visibile(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "documents_delete_admin" ON storage.objects;
CREATE POLICY "documents_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin()
  );

COMMIT;
