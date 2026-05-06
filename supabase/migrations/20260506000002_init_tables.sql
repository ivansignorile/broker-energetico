-- supabase/migrations/20260506000002_init_tables.sql
BEGIN;

CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ruolo         ruolo NOT NULL,
  nome_completo text NOT NULL,
  email         text NOT NULL,
  attivo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clienti (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_cliente    tipo_cliente NOT NULL,
  nome            text NOT NULL,
  email           text,
  telefono        text,
  indirizzo       text,
  lat             numeric,
  lng             numeric,
  note            text,
  commerciale_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT clienti_lat_lng_both_or_none CHECK (
    (lat IS NULL AND lng IS NULL) OR (lat IS NOT NULL AND lng IS NOT NULL)
  )
);

CREATE TABLE fornitori (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL UNIQUE,
  contatti    jsonb,
  note        text,
  attivo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contratti (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid NOT NULL REFERENCES clienti(id) ON DELETE CASCADE,
  fornitore_id    uuid NOT NULL REFERENCES fornitori(id) ON DELETE RESTRICT,
  categoria       categoria_contratto NOT NULL,
  tipo            tipo_contratto NOT NULL,
  mercato         mercato,
  pod             text,
  pdr             text,
  data_inizio     date NOT NULL,
  data_scadenza   date NOT NULL,
  stato           stato_contratto NOT NULL DEFAULT 'bozza',
  allegato_path   text,
  note            text,
  replaced_by_id  uuid REFERENCES contratti(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE documenti (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    uuid NOT NULL REFERENCES clienti(id) ON DELETE CASCADE,
  tipo          tipo_documento NOT NULL,
  descrizione   text,
  file_path     text NOT NULL,
  data_scadenza date,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE notifiche_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (entity_type IN ('contratto', 'documento')),
  entity_id       uuid NOT NULL,
  soglia          int NOT NULL CHECK (soglia IN (0, 15, 30, 60)),
  recipient_email text NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, soglia, recipient_email)
);

CREATE TABLE cron_runs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name  text NOT NULL,
  run_at    timestamptz NOT NULL DEFAULT now(),
  ok        boolean NOT NULL,
  summary   jsonb
);

-- Trigger updated_at automatico
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_clienti BEFORE UPDATE ON clienti
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_fornitori BEFORE UPDATE ON fornitori
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_contratti BEFORE UPDATE ON contratti
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_documenti BEFORE UPDATE ON documenti
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
