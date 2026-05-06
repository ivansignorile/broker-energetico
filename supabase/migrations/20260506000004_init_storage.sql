-- supabase/migrations/20260506000004_init_storage.sql
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
