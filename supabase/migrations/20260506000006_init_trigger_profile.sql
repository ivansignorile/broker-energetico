-- supabase/migrations/20260506000006_init_trigger_profile.sql
BEGIN;

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ruolo        ruolo;
  v_nome         text;
BEGIN
  v_ruolo := COALESCE(
    (NEW.raw_user_meta_data ->> 'ruolo')::ruolo,
    'operatore'::ruolo
  );
  v_nome := COALESCE(
    NEW.raw_user_meta_data ->> 'nome_completo',
    NEW.email
  );

  INSERT INTO public.profiles (id, ruolo, nome_completo, email)
  VALUES (NEW.id, v_ruolo, v_nome, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

COMMIT;
