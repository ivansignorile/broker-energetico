# Broker Energetico — Plan #1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap dell'app Next.js + Supabase con schema DB completo, RLS testata, autenticazione funzionante, layout di base e gestione utenti (invito + ruoli). Al termine: un admin può loggarsi, invitare altri utenti con ruolo, e vederli in lista. Le tabelle business (clienti, fornitori, contratti, documenti) esistono nello schema con RLS attiva ma senza UI ancora — quella arriva nei plan successivi.

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui (design system `cohere`). Supabase locale via CLI per dev e CI. Tutte le mutazioni passano da Server Actions con cookie HttpOnly. RLS attiva su ogni tabella, testata con vitest + tre utenti reali (admin, commerciale1, commerciale2). E2E smoke test con Playwright.

**Tech Stack:** Next.js 16 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · @supabase/ssr · @supabase/supabase-js · react-hook-form · zod · sonner · lucide-react · vitest · @playwright/test · pnpm

**Spec di riferimento:** `docs/superpowers/specs/2026-05-06-broker-energetico-design.md`

---

## File Structure

```
broker-energetico/
├── .env.example                       NEW · template variabili d'ambiente
├── .env.local                         NEW · (gitignored) valori dev locali
├── .gitignore                         NEW · ignora node_modules, .next, .env*
├── .nvmrc                             NEW · pin Node version
├── README.md                          NEW · setup dev, comandi, link spec
├── DESIGN.md                          NEW · generato da getdesign cohere
├── package.json                       NEW
├── tsconfig.json                      NEW
├── next.config.ts                     NEW
├── postcss.config.mjs                 NEW
├── eslint.config.mjs                  NEW
├── components.json                    NEW · config shadcn
├── vitest.config.ts                   NEW · single-fork per evitare conflitti RLS
├── playwright.config.ts               NEW
├── supabase/
│   ├── config.toml                    NEW · da supabase init
│   ├── seed.sql                       NEW · primo admin in dev
│   ├── migrations/
│   │   ├── 20260506000001_init_enums.sql                 NEW
│   │   ├── 20260506000002_init_tables.sql                NEW
│   │   ├── 20260506000003_init_view_indexes.sql          NEW
│   │   ├── 20260506000004_init_storage.sql               NEW
│   │   ├── 20260506000005_init_helpers.sql               NEW
│   │   ├── 20260506000006_init_trigger_profile.sql       NEW
│   │   ├── 20260506000007_rls_profiles.sql               NEW
│   │   ├── 20260506000008_rls_clienti.sql                NEW
│   │   ├── 20260506000009_rls_fornitori.sql              NEW
│   │   ├── 20260506000010_rls_contratti.sql              NEW
│   │   ├── 20260506000011_rls_documenti.sql              NEW
│   │   ├── 20260506000012_rls_notifiche_log.sql          NEW
│   │   ├── 20260506000013_rls_cron_runs.sql              NEW
│   │   └── 20260506000014_rls_storage.sql                NEW
├── scripts/
│   ├── seed-dev-users.ts              NEW · crea 3 utenti test (admin, commerciale, operatore)
│   └── reset-db.ts                    NEW · convenience: db reset + seed
├── src/
│   ├── middleware.ts                  NEW · protegge route (app), refresha cookie Supabase
│   ├── app/
│   │   ├── layout.tsx                 NEW · root: font, providers, toaster
│   │   ├── page.tsx                   NEW · redirect /dashboard
│   │   ├── globals.css                NEW · Tailwind + tokens da DESIGN.md
│   │   ├── (auth)/
│   │   │   ├── layout.tsx             NEW · centra form
│   │   │   ├── login/page.tsx         NEW
│   │   │   ├── accept-invite/page.tsx NEW
│   │   │   ├── forgot-password/page.tsx NEW
│   │   │   └── reset-password/page.tsx  NEW
│   │   └── (app)/
│   │       ├── layout.tsx             NEW · sidebar + topbar; richiede auth
│   │       ├── dashboard/page.tsx     NEW · placeholder per Plan #3
│   │       ├── utenti/page.tsx        NEW · solo admin: lista profiles
│   │       └── utenti/invita/page.tsx NEW · solo admin: form invito
│   ├── components/
│   │   ├── ui/                        NEW · componenti shadcn aggiunti via CLI
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx          NEW
│   │   │   ├── AcceptInviteForm.tsx   NEW
│   │   │   ├── ForgotPasswordForm.tsx NEW
│   │   │   ├── ResetPasswordForm.tsx  NEW
│   │   │   └── RoleGuard.tsx          NEW · nasconde UI a ruoli non autorizzati
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            NEW
│   │   │   ├── TopBar.tsx             NEW
│   │   │   └── UserMenu.tsx           NEW
│   │   └── utenti/
│   │       ├── UtentiTable.tsx        NEW
│   │       └── InvitaUtenteForm.tsx   NEW
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts              NEW · createClient() server-side con cookies
│   │   │   ├── client.ts              NEW · createClient() browser
│   │   │   ├── service.ts             NEW · service role; usato solo in invito + future cron
│   │   │   └── types.ts               NEW · alias re-export dei tipi DB
│   │   ├── auth/
│   │   │   ├── session.ts             NEW · getCurrentProfile, requireRole, isAdmin
│   │   │   └── invite-action.ts       NEW · Server Action invitaUtente
│   │   ├── validation/
│   │   │   └── invito-schema.ts       NEW · Zod schema condiviso
│   │   └── utils.ts                   NEW · cn() helper shadcn
│   └── types/
│       └── database.ts                NEW · tipi generati da supabase gen types
├── tests/
│   ├── rls/
│   │   ├── helpers.ts                 NEW · createTestUser, signInAs, makeAuthedClient
│   │   ├── profiles.test.ts           NEW
│   │   ├── clienti.test.ts            NEW
│   │   ├── fornitori.test.ts          NEW
│   │   ├── contratti.test.ts          NEW
│   │   ├── documenti.test.ts          NEW
│   │   └── notifiche-log.test.ts      NEW
│   └── e2e/
│       └── auth.spec.ts               NEW · login → dashboard
└── .github/
    └── workflows/
        └── ci.yml                     NEW · typecheck, lint, test, build
```

---

## Conventions

- Package manager: **pnpm**
- Node version: **22** (LTS al 2026-05)
- Quoting JS: doppi apici nella maggior parte del codice mostrato; segui `eslint --fix` se diverge
- Migrazioni SQL: ogni file inizia con `BEGIN;` e finisce con `COMMIT;` per atomicità
- Test RLS: tre utenti reali, vitest, file `.test.ts` in `tests/rls/`
- Commit style: convenzionale (`feat:`, `chore:`, `test:`, `docs:`); **mai** trailer Claude/AI

---

## Task 1: Init progetto Next.js e tooling base

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `.nvmrc`, `.env.example`, `README.md`

- [ ] **Step 1.1: Creare progetto con create-next-app**

Run dalla cartella padre (NON dalla cartella corrente):

```bash
cd /Users/ivansignorile/barikreativa
pnpm create next-app@latest broker-energetico-tmp \
  --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --turbopack --no-git
```

Then move generated files into the existing folder:

```bash
cd broker-energetico
shopt -s dotglob
mv ../broker-energetico-tmp/* .
rmdir ../broker-energetico-tmp
shopt -u dotglob
```

Expected: `package.json`, `src/app/`, `tailwind.config.*` (or none if Tailwind v4), `next.config.ts` exist in current dir. Existing files (`docs/`, `contesto-richiesta.docx`, `.git/`) preserved.

- [ ] **Step 1.2: Pin Node version e fix .gitignore**

Create `.nvmrc`:

```
22
```

Append to `.gitignore`:

```
# env
.env
.env.local
.env.*.local

# editor
.idea/
.vscode/

# os
.DS_Store

# test
playwright-report/
test-results/
coverage/

# supabase
supabase/.branches/
supabase/.temp/
```

- [ ] **Step 1.3: Aggiungere dipendenze app**

```bash
pnpm add @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod sonner lucide-react clsx tailwind-merge class-variance-authority
```

- [ ] **Step 1.4: Aggiungere dipendenze dev**

```bash
pnpm add -D vitest @vitest/ui @types/node tsx dotenv-cli @playwright/test prettier prettier-plugin-tailwindcss
```

- [ ] **Step 1.5: Verificare build di base**

```bash
pnpm build
```

Expected: build completa senza errori; output in `.next/`.

- [ ] **Step 1.6: Commit**

```bash
git add -A
git commit -m "chore: bootstrap next.js 16 + supabase deps"
```

---

## Task 2: shadcn/ui + design system cohere

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*` (auto), `DESIGN.md`
- Modify: `src/app/globals.css`

- [ ] **Step 2.1: Inizializzare shadcn**

```bash
pnpm dlx shadcn@latest init
```

Quando chiede:
- Style: `New York`
- Base color: `Neutral` (verrà sovrascritto dal design system cohere)
- CSS variables: `Yes`

Verifica creazione di `components.json` e `src/lib/utils.ts`.

- [ ] **Step 2.2: Aggiungere componenti shadcn richiesti dal Plan #1**

```bash
pnpm dlx shadcn@latest add button input label form card table dialog dropdown-menu sonner skeleton badge separator
```

Verifica `src/components/ui/` popolata.

- [ ] **Step 2.3: Generare design system cohere**

```bash
pnpm dlx getdesign@latest add cohere
```

Verifica creazione di `DESIGN.md` nella root.

- [ ] **Step 2.4: Applicare i token cohere a `src/app/globals.css`**

Apri `DESIGN.md` e copia i token CSS (custom properties) nella sezione `@layer base { :root { ... } }` di `src/app/globals.css`. Sostituisci i token shadcn di default con quelli di cohere. Mantieni gli `@import "tailwindcss"` e le direttive shadcn esistenti.

- [ ] **Step 2.5: Smoke test visivo**

Avvia dev server:

```bash
pnpm dev
```

Apri `http://localhost:3000` — deve renderizzare la home Next default usando i nuovi token (font, colore di sfondo) di cohere. Stop server (Ctrl+C).

- [ ] **Step 2.6: Commit**

```bash
git add -A
git commit -m "chore: add shadcn ui and cohere design system"
```

---

## Task 3: Init Supabase locale + script di reset

**Files:**
- Create: `supabase/config.toml` (auto), `scripts/reset-db.ts`
- Modify: `package.json` (scripts), `.env.example`

- [ ] **Step 3.1: Inizializzare Supabase**

```bash
pnpm dlx supabase init
```

Quando chiede di generare VS Code settings: rispondi `n`. Verifica creazione di `supabase/config.toml`.

- [ ] **Step 3.2: Avviare stack Supabase locale**

```bash
pnpm dlx supabase start
```

Annota i valori restituiti: `API URL`, `DB URL`, `anon key`, `service_role key`. Saranno usati in `.env.local`.

- [ ] **Step 3.3: Creare `.env.example`**

```env
# Public (browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>

# Server-only
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>

# Used in Plan #2
NOMINATIM_USER_AGENT=BrokerEnergetico/1.0 (ivan@barikreativa.com)

# Used in Plan #4
CRON_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET=
B2_BUCKET_ID=
B2_ENDPOINT=
MAX_UPLOAD_MB=10
```

- [ ] **Step 3.4: Creare `.env.local` (NON committare)**

Copia `.env.example` in `.env.local` e popola con i valori reali del passo 3.2.

- [ ] **Step 3.5: Aggiungere script npm a `package.json`**

In `"scripts"` aggiungi:

```json
"db:start": "supabase start",
"db:stop": "supabase stop",
"db:reset": "supabase db reset",
"db:types": "supabase gen types typescript --local > src/types/database.ts",
"db:diff": "supabase db diff",
"test": "vitest run",
"test:watch": "vitest",
"test:rls": "vitest run tests/rls",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 3.6: Aggiungere alla `package.json` un campo `engines`**

```json
"engines": {
  "node": ">=22.0.0",
  "pnpm": ">=9.0.0"
}
```

- [ ] **Step 3.7: Verifica reset DB pulito**

```bash
pnpm db:reset
```

Expected: messaggio "Finished supabase db reset" senza errori (DB è vuoto, è solo uno smoke test del comando).

- [ ] **Step 3.8: Commit**

```bash
git add -A
git commit -m "chore: init local supabase and db scripts"
```

---

## Task 4: Migrazione enum

**Files:**
- Create: `supabase/migrations/20260506000001_init_enums.sql`

- [ ] **Step 4.1: Creare il file di migrazione**

```sql
-- supabase/migrations/20260506000001_init_enums.sql
BEGIN;

CREATE TYPE ruolo AS ENUM ('admin', 'commerciale', 'operatore');

CREATE TYPE tipo_cliente AS ENUM ('privato', 'azienda');

CREATE TYPE mercato AS ENUM ('libero', 'tutelato');

CREATE TYPE stato_contratto AS ENUM (
  'bozza', 'attivo', 'scaduto', 'rinnovato', 'annullato'
);

CREATE TYPE categoria_contratto AS ENUM (
  'energia', 'rinnovabili', 'riscaldamento', 'utility', 'servizi'
);

CREATE TYPE tipo_contratto AS ENUM (
  'luce', 'gas', 'dual_fuel',
  'fotovoltaico', 'accumulo', 'comunita_energetica', 'ricarica_ev',
  'teleriscaldamento', 'gpl', 'pellet',
  'idrico', 'internet_fibra', 'telefonia',
  'efficienza_energetica', 'diagnosi_energetica',
  'manutenzione', 'assicurativo'
);

CREATE TYPE tipo_documento AS ENUM (
  'carta_identita', 'passaporto', 'patente', 'permesso_soggiorno',
  'codice_fiscale', 'tessera_sanitaria', 'partita_iva',
  'visura_camerale', 'certificato_attribuzione_piva',
  'bolletta_recente', 'delega_voltura', 'mandato_consulenza',
  'privacy_gdpr', 'iban', 'rid_sepa',
  'altro'
);

COMMIT;
```

- [ ] **Step 4.2: Applicare e verificare**

```bash
pnpm db:reset
```

Expected: la migrazione si applica senza errori. Verifica:

```bash
pnpm dlx supabase db diff --schema public
```

Expected: nessuna differenza (tutto è in migrazione).

- [ ] **Step 4.3: Commit**

```bash
git add supabase/migrations/20260506000001_init_enums.sql
git commit -m "feat(db): add enum types"
```

---

## Task 5: Migrazione tabelle

**Files:**
- Create: `supabase/migrations/20260506000002_init_tables.sql`

- [ ] **Step 5.1: Creare il file**

```sql
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
```

- [ ] **Step 5.2: Applicare**

```bash
pnpm db:reset
```

Expected: nessun errore. Verifica con `pnpm dlx supabase db dump --local --schema public --data-only=false | head -100` che le tabelle siano presenti.

- [ ] **Step 5.3: Commit**

```bash
git add supabase/migrations/20260506000002_init_tables.sql
git commit -m "feat(db): add core tables and updated_at triggers"
```

---

## Task 6: View derivata + indici

**Files:**
- Create: `supabase/migrations/20260506000003_init_view_indexes.sql`

- [ ] **Step 6.1: Creare il file**

```sql
-- supabase/migrations/20260506000003_init_view_indexes.sql
BEGIN;

CREATE VIEW v_contratti
WITH (security_invoker = true) AS
SELECT
  c.*,
  (c.data_scadenza - CURRENT_DATE) AS giorni_alla_scadenza,
  (c.stato = 'attivo'
    AND c.data_scadenza <= CURRENT_DATE + INTERVAL '60 days'
    AND c.data_scadenza >= CURRENT_DATE) AS is_in_scadenza
FROM contratti c;

CREATE INDEX idx_clienti_commerciale_id ON clienti (commerciale_id);
CREATE INDEX idx_clienti_email          ON clienti (email);
CREATE INDEX idx_contratti_cliente_id   ON contratti (cliente_id);
CREATE INDEX idx_contratti_fornitore_id ON contratti (fornitore_id);
CREATE INDEX idx_contratti_stato        ON contratti (stato);
CREATE INDEX idx_contratti_scadenza     ON contratti (data_scadenza);
CREATE INDEX idx_documenti_cliente_id   ON documenti (cliente_id);
CREATE INDEX idx_documenti_scadenza     ON documenti (data_scadenza)
  WHERE data_scadenza IS NOT NULL;
CREATE INDEX idx_notifiche_log_entity   ON notifiche_log (entity_type, entity_id);

COMMIT;
```

`security_invoker = true` sulla view fa sì che le RLS della tabella sottostante siano applicate al chiamante della view (non al definer). Critico perché `v_contratti` deve rispettare le policy di `contratti`.

- [ ] **Step 6.2: Applicare**

```bash
pnpm db:reset
```

- [ ] **Step 6.3: Commit**

```bash
git add supabase/migrations/20260506000003_init_view_indexes.sql
git commit -m "feat(db): add v_contratti view and indexes"
```

---

## Task 7: Storage bucket privato

**Files:**
- Create: `supabase/migrations/20260506000004_init_storage.sql`

- [ ] **Step 7.1: Creare il file**

```sql
-- supabase/migrations/20260506000004_init_storage.sql
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

Le policy del bucket le aggiungiamo nel Task 16, dopo quelle delle tabelle (riusano `current_ruolo()` e join con `clienti`).

- [ ] **Step 7.2: Applicare**

```bash
pnpm db:reset
```

- [ ] **Step 7.3: Commit**

```bash
git add supabase/migrations/20260506000004_init_storage.sql
git commit -m "feat(db): add private storage bucket"
```

---

## Task 8: Helper SQL functions

**Files:**
- Create: `supabase/migrations/20260506000005_init_helpers.sql`

- [ ] **Step 8.1: Creare il file**

```sql
-- supabase/migrations/20260506000005_init_helpers.sql
BEGIN;

CREATE OR REPLACE FUNCTION public.current_ruolo()
RETURNS ruolo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT ruolo FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT current_ruolo() = 'admin'::ruolo;
$$;

CREATE OR REPLACE FUNCTION public.cliente_visibile(target_cliente_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    CASE
      WHEN current_ruolo() IN ('admin'::ruolo, 'operatore'::ruolo) THEN true
      WHEN current_ruolo() = 'commerciale'::ruolo THEN
        EXISTS (
          SELECT 1 FROM clienti
          WHERE id = target_cliente_id
            AND (commerciale_id = auth.uid() OR commerciale_id IS NULL)
        )
      ELSE false
    END;
$$;

REVOKE ALL ON FUNCTION public.current_ruolo() FROM public;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.cliente_visibile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.current_ruolo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_visibile(uuid) TO authenticated;

COMMIT;
```

- [ ] **Step 8.2: Applicare**

```bash
pnpm db:reset
```

- [ ] **Step 8.3: Commit**

```bash
git add supabase/migrations/20260506000005_init_helpers.sql
git commit -m "feat(db): add rls helper sql functions"
```

---

## Task 9: Trigger creazione profilo da invito

**Files:**
- Create: `supabase/migrations/20260506000006_init_trigger_profile.sql`

- [ ] **Step 9.1: Creare il file**

```sql
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
```

- [ ] **Step 9.2: Applicare**

```bash
pnpm db:reset
```

- [ ] **Step 9.3: Commit**

```bash
git add supabase/migrations/20260506000006_init_trigger_profile.sql
git commit -m "feat(db): auto-create profile on auth user creation"
```

---

## Task 10: Setup vitest + RLS test helpers

**Files:**
- Create: `vitest.config.ts`, `tests/rls/helpers.ts`, `tests/setup.ts`
- Modify: `package.json`, `.env.example`

- [ ] **Step 10.1: Creare `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // RLS tests share the local Supabase DB. Run sequentially to avoid conflicts.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
  },
});
```

- [ ] **Step 10.2: Creare `tests/setup.ts`**

```ts
// tests/setup.ts
import { config } from "dotenv";

// In CI uses .env.test; in local dev uses .env.local
config({ path: ".env.test" });
config({ path: ".env.local", override: false });
```

- [ ] **Step 10.3: Aggiornare `.env.example` con fallback test env**

Append:

```env
# Test (opzionale; se assenti i test usano .env.local)
TEST_SUPABASE_URL=
TEST_SUPABASE_ANON_KEY=
TEST_SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 10.4: Creare `tests/rls/helpers.ts`**

```ts
// tests/rls/helpers.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL =
  process.env.TEST_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.TEST_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type Ruolo = "admin" | "commerciale" | "operatore";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  ruolo: Ruolo;
  client: SupabaseClient;
};

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(ruolo: Ruolo): Promise<TestUser> {
  const id = randomUUID();
  const email = `test-${id}@example.com`;
  const password = "Password123!";
  const admin = adminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { ruolo, nome_completo: `Test ${ruolo} ${id.slice(0, 6)}` },
  });
  if (error) throw error;
  if (!data.user) throw new Error("user not created");

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { id: data.user.id, email, password, ruolo, client };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function resetData(): Promise<void> {
  const admin = adminClient();
  await admin.from("notifiche_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("documenti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("contratti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("clienti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("fornitori").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
```

- [ ] **Step 10.5: Smoke test del setup**

Crea un file di smoke test temporaneo `tests/rls/smoke.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import { createTestUser, deleteTestUser } from "./helpers";

describe("smoke: helpers", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (userId) await deleteTestUser(userId);
    userId = null;
  });

  it("creates and deletes a test user", async () => {
    const user = await createTestUser("admin");
    userId = user.id;
    expect(user.email).toMatch(/test-/);
    expect(user.ruolo).toBe("admin");
  });
});
```

Run:

```bash
pnpm test:rls
```

Expected: 1 passed.

Cancella `tests/rls/smoke.test.ts` dopo (è un check temporaneo).

```bash
rm tests/rls/smoke.test.ts
```

- [ ] **Step 10.6: Commit**

```bash
git add -A
git commit -m "test: vitest config and rls test helpers"
```

---

## Task 11: RLS profiles + test

**Files:**
- Create: `supabase/migrations/20260506000007_rls_profiles.sql`, `tests/rls/profiles.test.ts`

- [ ] **Step 11.1: Scrivere il test (failing first)**

```ts
// tests/rls/profiles.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: profiles", () => {
  let admin: TestUser;
  let commerciale: TestUser;
  let operatore: TestUser;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    commerciale = await createTestUser("commerciale");
    operatore = await createTestUser("operatore");
  });

  afterAll(async () => {
    await deleteTestUser(admin.id);
    await deleteTestUser(commerciale.id);
    await deleteTestUser(operatore.id);
  });

  it("authenticated users can SELECT all profiles", async () => {
    const { data, error } = await commerciale.client.from("profiles").select("id, ruolo");
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("non-admin cannot UPDATE another profile", async () => {
    const { error } = await commerciale.client
      .from("profiles")
      .update({ nome_completo: "hacked" })
      .eq("id", admin.id);
    // Either RLS rejects or returns empty result; check via re-read
    const reread = await admin.client.from("profiles").select("nome_completo").eq("id", admin.id).single();
    expect(reread.data?.nome_completo).not.toBe("hacked");
  });

  it("admin can UPDATE another profile", async () => {
    const newName = `Admin updated ${Date.now()}`;
    const { error } = await admin.client
      .from("profiles")
      .update({ nome_completo: newName })
      .eq("id", commerciale.id);
    expect(error).toBeNull();
    const reread = await admin.client.from("profiles").select("nome_completo").eq("id", commerciale.id).single();
    expect(reread.data?.nome_completo).toBe(newName);
  });
});
```

- [ ] **Step 11.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/profiles.test.ts
```

Expected: alcuni test falliscono perché RLS non è ancora attiva (default Supabase: senza policy + RLS attivata = nessuno vede; o RLS non attivata = tutti vedono e modificano). Annota l'output.

- [ ] **Step 11.3: Scrivere migrazione RLS profiles**

```sql
-- supabase/migrations/20260506000007_rls_profiles.sql
BEGIN;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
```

- [ ] **Step 11.4: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls tests/rls/profiles.test.ts
```

Expected: tutti i test passano.

- [ ] **Step 11.5: Commit**

```bash
git add -A
git commit -m "feat(db): rls policies and tests for profiles"
```

---

## Task 12: RLS clienti + test

**Files:**
- Create: `supabase/migrations/20260506000008_rls_clienti.sql`, `tests/rls/clienti.test.ts`

- [ ] **Step 12.1: Scrivere il test**

```ts
// tests/rls/clienti.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: clienti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let operatore: TestUser;
  let clienteCommerciale1Id: string;
  let clienteOrfanoId: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");
    operatore = await createTestUser("operatore");

    const svc = adminClient();
    const inserted1 = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Cliente di Comm1",
      commerciale_id: comm1.id,
    }).select("id").single();
    clienteCommerciale1Id = inserted1.data!.id;

    const insertedOrfano = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Cliente orfano",
      commerciale_id: null,
    }).select("id").single();
    clienteOrfanoId = insertedOrfano.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2, operatore]) await deleteTestUser(u.id);
  });

  it("admin sees all clienti", async () => {
    const { data } = await admin.client.from("clienti").select("id");
    expect(data?.length ?? 0).toBe(2);
  });

  it("operatore sees all clienti", async () => {
    const { data } = await operatore.client.from("clienti").select("id");
    expect(data?.length ?? 0).toBe(2);
  });

  it("commerciale sees own + orphan clienti", async () => {
    const { data } = await comm1.client.from("clienti").select("id");
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).toContain(clienteCommerciale1Id);
    expect(ids).toContain(clienteOrfanoId);
    expect(ids.length).toBe(2);
  });

  it("commerciale does NOT see other commerciale's clienti", async () => {
    const { data } = await comm2.client.from("clienti").select("id");
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).not.toContain(clienteCommerciale1Id);
    expect(ids).toContain(clienteOrfanoId);
  });

  it("commerciale cannot DELETE clienti", async () => {
    const { error } = await comm1.client.from("clienti").delete().eq("id", clienteCommerciale1Id);
    // RLS rejects: error or zero rows affected; verify cliente still exists
    const reread = await admin.client.from("clienti").select("id").eq("id", clienteCommerciale1Id).maybeSingle();
    expect(reread.data?.id).toBe(clienteCommerciale1Id);
  });

  it("admin can DELETE clienti", async () => {
    const svc = adminClient();
    const { data: created } = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "ToDelete",
    }).select("id").single();
    const { error } = await admin.client.from("clienti").delete().eq("id", created!.id);
    expect(error).toBeNull();
  });
});
```

- [ ] **Step 12.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/clienti.test.ts
```

- [ ] **Step 12.3: Scrivere migrazione RLS clienti**

```sql
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
```

- [ ] **Step 12.4: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls tests/rls/clienti.test.ts
```

Expected: tutti i test passano.

- [ ] **Step 12.5: Commit**

```bash
git add -A
git commit -m "feat(db): rls policies and tests for clienti"
```

---

## Task 13: RLS fornitori + test

**Files:**
- Create: `supabase/migrations/20260506000009_rls_fornitori.sql`, `tests/rls/fornitori.test.ts`

- [ ] **Step 13.1: Scrivere il test**

```ts
// tests/rls/fornitori.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: fornitori", () => {
  let admin: TestUser;
  let comm: TestUser;
  let fornitoreId: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm = await createTestUser("commerciale");

    const svc = adminClient();
    const ins = await svc.from("fornitori").insert({ nome: "Enel Energia" }).select("id").single();
    fornitoreId = ins.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm]) await deleteTestUser(u.id);
  });

  it("all roles can SELECT fornitori", async () => {
    const { data } = await comm.client.from("fornitori").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("commerciale cannot INSERT fornitori", async () => {
    const { error } = await comm.client.from("fornitori").insert({ nome: "Hacker Energia" });
    expect(error).not.toBeNull();
  });

  it("admin can INSERT fornitori", async () => {
    const { error } = await admin.client.from("fornitori").insert({ nome: "Edison" });
    expect(error).toBeNull();
  });

  it("commerciale cannot UPDATE fornitori", async () => {
    const newName = `Hacked ${Date.now()}`;
    await comm.client.from("fornitori").update({ nome: newName }).eq("id", fornitoreId);
    const reread = await admin.client.from("fornitori").select("nome").eq("id", fornitoreId).single();
    expect(reread.data?.nome).not.toBe(newName);
  });
});
```

- [ ] **Step 13.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/fornitori.test.ts
```

- [ ] **Step 13.3: Scrivere migrazione**

```sql
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
```

- [ ] **Step 13.4: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls tests/rls/fornitori.test.ts
```

- [ ] **Step 13.5: Commit**

```bash
git add -A
git commit -m "feat(db): rls policies and tests for fornitori"
```

---

## Task 14: RLS contratti + test

**Files:**
- Create: `supabase/migrations/20260506000010_rls_contratti.sql`, `tests/rls/contratti.test.ts`

- [ ] **Step 14.1: Scrivere il test**

```ts
// tests/rls/contratti.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: contratti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let cliente1Id: string;
  let fornitoreId: string;
  let contrattoComm1Id: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");

    const svc = adminClient();
    const f = await svc.from("fornitori").insert({ nome: "Enel" }).select("id").single();
    fornitoreId = f.data!.id;

    const c = await svc.from("clienti").insert({
      tipo_cliente: "azienda",
      nome: "Acme SRL",
      commerciale_id: comm1.id,
    }).select("id").single();
    cliente1Id = c.data!.id;

    const co = await svc.from("contratti").insert({
      cliente_id: cliente1Id,
      fornitore_id: fornitoreId,
      categoria: "energia",
      tipo: "luce",
      data_inizio: "2026-01-01",
      data_scadenza: "2027-01-01",
      stato: "attivo",
    }).select("id").single();
    contrattoComm1Id = co.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2]) await deleteTestUser(u.id);
  });

  it("comm1 sees contratti of own cliente", async () => {
    const { data } = await comm1.client.from("contratti").select("id");
    expect((data ?? []).map((r) => r.id)).toContain(contrattoComm1Id);
  });

  it("comm2 does NOT see contratti of comm1's cliente", async () => {
    const { data } = await comm2.client.from("contratti").select("id");
    expect((data ?? []).map((r) => r.id)).not.toContain(contrattoComm1Id);
  });

  it("admin sees all contratti", async () => {
    const { data } = await admin.client.from("contratti").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("comm1 can UPDATE contratti of own cliente", async () => {
    const { error } = await comm1.client.from("contratti").update({ note: "aggiornato" }).eq("id", contrattoComm1Id);
    expect(error).toBeNull();
  });

  it("comm2 cannot UPDATE contratti of comm1's cliente", async () => {
    await comm2.client.from("contratti").update({ note: "hacked" }).eq("id", contrattoComm1Id);
    const reread = await admin.client.from("contratti").select("note").eq("id", contrattoComm1Id).single();
    expect(reread.data?.note).not.toBe("hacked");
  });

  it("comm1 cannot DELETE contratti", async () => {
    await comm1.client.from("contratti").delete().eq("id", contrattoComm1Id);
    const reread = await admin.client.from("contratti").select("id").eq("id", contrattoComm1Id).maybeSingle();
    expect(reread.data?.id).toBe(contrattoComm1Id);
  });
});
```

- [ ] **Step 14.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/contratti.test.ts
```

- [ ] **Step 14.3: Scrivere migrazione**

```sql
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
```

- [ ] **Step 14.4: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls tests/rls/contratti.test.ts
```

- [ ] **Step 14.5: Commit**

```bash
git add -A
git commit -m "feat(db): rls policies and tests for contratti"
```

---

## Task 15: RLS documenti + test

**Files:**
- Create: `supabase/migrations/20260506000011_rls_documenti.sql`, `tests/rls/documenti.test.ts`

- [ ] **Step 15.1: Scrivere il test**

```ts
// tests/rls/documenti.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: documenti", () => {
  let admin: TestUser;
  let comm1: TestUser;
  let comm2: TestUser;
  let cliente1Id: string;
  let documentoComm1Id: string;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm1 = await createTestUser("commerciale");
    comm2 = await createTestUser("commerciale");

    const svc = adminClient();
    const c = await svc.from("clienti").insert({
      tipo_cliente: "privato",
      nome: "Mario Rossi",
      commerciale_id: comm1.id,
    }).select("id").single();
    cliente1Id = c.data!.id;

    const d = await svc.from("documenti").insert({
      cliente_id: cliente1Id,
      tipo: "carta_identita",
      file_path: `${cliente1Id}/documenti/test/test.pdf`,
      data_scadenza: "2027-01-01",
    }).select("id").single();
    documentoComm1Id = d.data!.id;
  });

  afterAll(async () => {
    for (const u of [admin, comm1, comm2]) await deleteTestUser(u.id);
  });

  it("comm1 sees documenti of own cliente", async () => {
    const { data } = await comm1.client.from("documenti").select("id");
    expect((data ?? []).map((r) => r.id)).toContain(documentoComm1Id);
  });

  it("comm2 does NOT see documenti of comm1's cliente", async () => {
    const { data } = await comm2.client.from("documenti").select("id");
    expect((data ?? []).map((r) => r.id)).not.toContain(documentoComm1Id);
  });

  it("admin sees all documenti", async () => {
    const { data } = await admin.client.from("documenti").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 15.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/documenti.test.ts
```

- [ ] **Step 15.3: Scrivere migrazione**

```sql
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
```

- [ ] **Step 15.4: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls tests/rls/documenti.test.ts
```

- [ ] **Step 15.5: Commit**

```bash
git add -A
git commit -m "feat(db): rls policies and tests for documenti"
```

---

## Task 16: RLS notifiche_log, cron_runs, storage bucket + test

**Files:**
- Create:
  - `supabase/migrations/20260506000012_rls_notifiche_log.sql`
  - `supabase/migrations/20260506000013_rls_cron_runs.sql`
  - `supabase/migrations/20260506000014_rls_storage.sql`
  - `tests/rls/notifiche-log.test.ts`

- [ ] **Step 16.1: Scrivere test notifiche_log**

```ts
// tests/rls/notifiche-log.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, resetData, type TestUser } from "./helpers";

describe("RLS: notifiche_log", () => {
  let admin: TestUser;
  let comm: TestUser;

  beforeAll(async () => {
    await resetData();
    admin = await createTestUser("admin");
    comm = await createTestUser("commerciale");

    const svc = adminClient();
    await svc.from("notifiche_log").insert({
      entity_type: "contratto",
      entity_id: "00000000-0000-0000-0000-000000000001",
      soglia: 60,
      recipient_email: "test@example.com",
    });
  });

  afterAll(async () => {
    for (const u of [admin, comm]) await deleteTestUser(u.id);
  });

  it("admin can SELECT notifiche_log", async () => {
    const { data } = await admin.client.from("notifiche_log").select("id");
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("commerciale cannot SELECT notifiche_log", async () => {
    const { data } = await comm.client.from("notifiche_log").select("id");
    expect(data?.length ?? 0).toBe(0);
  });

  it("nobody can INSERT notifiche_log via authenticated", async () => {
    const { error } = await admin.client.from("notifiche_log").insert({
      entity_type: "contratto",
      entity_id: "00000000-0000-0000-0000-000000000002",
      soglia: 30,
      recipient_email: "x@example.com",
    });
    expect(error).not.toBeNull();
  });
});
```

- [ ] **Step 16.2: Run test (deve fallire)**

```bash
pnpm test:rls tests/rls/notifiche-log.test.ts
```

- [ ] **Step 16.3: Scrivere migrazione `notifiche_log`**

```sql
-- supabase/migrations/20260506000012_rls_notifiche_log.sql
BEGIN;

ALTER TABLE notifiche_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifiche_log_select_admin" ON notifiche_log;
CREATE POLICY "notifiche_log_select_admin"
  ON notifiche_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT/UPDATE/DELETE: nessuna policy → bloccati per tutti gli utenti.
-- Solo service_role bypassa RLS (usato dal cron in Plan #4).

COMMIT;
```

- [ ] **Step 16.4: Scrivere migrazione `cron_runs`**

```sql
-- supabase/migrations/20260506000013_rls_cron_runs.sql
BEGIN;

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cron_runs_select_admin" ON cron_runs;
CREATE POLICY "cron_runs_select_admin"
  ON cron_runs FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMIT;
```

- [ ] **Step 16.5: Scrivere migrazione storage policy**

```sql
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
```

- [ ] **Step 16.6: Applicare e rieseguire test**

```bash
pnpm db:reset && pnpm test:rls
```

Expected: tutti i test RLS passano.

- [ ] **Step 16.7: Commit**

```bash
git add -A
git commit -m "feat(db): rls for notifiche_log, cron_runs and storage"
```

---

## Task 17: Generare tipi TypeScript dal DB

**Files:**
- Create: `src/types/database.ts`, `src/lib/supabase/types.ts`

- [ ] **Step 17.1: Generare i tipi**

```bash
pnpm db:types
```

Verifica creazione di `src/types/database.ts` con la definizione `Database`.

- [ ] **Step 17.2: Creare alias riusabili**

```ts
// src/lib/supabase/types.ts
import type { Database } from "@/types/database";

export type Tables = Database["public"]["Tables"];
export type Enums  = Database["public"]["Enums"];

export type Profile   = Tables["profiles"]["Row"];
export type Cliente   = Tables["clienti"]["Row"];
export type Fornitore = Tables["fornitori"]["Row"];
export type Contratto = Tables["contratti"]["Row"];
export type Documento = Tables["documenti"]["Row"];

export type Ruolo            = Enums["ruolo"];
export type TipoCliente      = Enums["tipo_cliente"];
export type StatoContratto   = Enums["stato_contratto"];
export type CategoriaContratto = Enums["categoria_contratto"];
export type TipoContratto    = Enums["tipo_contratto"];
export type TipoDocumento    = Enums["tipo_documento"];
```

- [ ] **Step 17.3: Verifica typecheck**

```bash
pnpm typecheck
```

Expected: 0 errori.

- [ ] **Step 17.4: Commit**

```bash
git add -A
git commit -m "feat(types): generate database types and aliases"
```

---

## Task 18: Supabase clients (server, browser, service)

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/service.ts`

- [ ] **Step 18.1: Server client (con cookies)**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies; safe to ignore — middleware refreshes them.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 18.2: Browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 18.3: Service client (no cookies, usa service role)**

```ts
// src/lib/supabase/service.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * USE CAREFULLY: bypassa RLS. Solo in:
 * - Server Action di invito utente (Task 28)
 * - Cron handlers (Plan #4)
 * - Script CLI di seed
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 18.4: Verifica typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 18.5: Commit**

```bash
git add -A
git commit -m "feat(lib): supabase server, browser, and service clients"
```

---

## Task 19: Auth session helpers + test

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/session.test.ts`

- [ ] **Step 19.1: Helpers**

```ts
// src/lib/auth/session.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Ruolo } from "@/lib/supabase/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.attivo) redirect("/login?disabled=1");
  return profile;
}

export async function requireRole(...roles: Ruolo[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.ruolo)) redirect("/dashboard?forbidden=1");
  return profile;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.ruolo === "admin";
}
export function isCommerciale(profile: Profile | null): boolean {
  return profile?.ruolo === "commerciale";
}
export function isOperatore(profile: Profile | null): boolean {
  return profile?.ruolo === "operatore";
}
```

- [ ] **Step 19.2: Test unit per i predicati (no fetch)**

```ts
// src/lib/auth/session.test.ts
import { describe, it, expect } from "vitest";
import { isAdmin, isCommerciale, isOperatore } from "./session";
import type { Profile } from "@/lib/supabase/types";

const mk = (ruolo: Profile["ruolo"]): Profile => ({
  id: "x", ruolo, nome_completo: "x", email: "x@x.x", attivo: true,
  created_at: "", updated_at: "",
});

describe("session predicates", () => {
  it("isAdmin true only for admin", () => {
    expect(isAdmin(mk("admin"))).toBe(true);
    expect(isAdmin(mk("commerciale"))).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("isCommerciale", () => {
    expect(isCommerciale(mk("commerciale"))).toBe(true);
    expect(isCommerciale(mk("admin"))).toBe(false);
  });

  it("isOperatore", () => {
    expect(isOperatore(mk("operatore"))).toBe(true);
    expect(isOperatore(mk("admin"))).toBe(false);
  });
});
```

- [ ] **Step 19.3: Run unit tests**

```bash
pnpm test src/lib/auth/session.test.ts
```

Expected: 3 passed.

- [ ] **Step 19.4: Commit**

```bash
git add -A
git commit -m "feat(auth): session helpers and unit tests"
```

---

## Task 20: Middleware protected routes

**Files:**
- Create: `src/middleware.ts`

> Con `--src-dir`, Next.js richiede il middleware in `src/middleware.ts` (non in root).

- [ ] **Step 20.1: Middleware**

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh Supabase session cookie on every request
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 20.2: Smoke test manuale**

```bash
pnpm dev
```

Apri `http://localhost:3000/dashboard` (non loggato) → deve fare redirect a `/login?next=/dashboard`. Stop server.

- [ ] **Step 20.3: Commit**

```bash
git add -A
git commit -m "feat(auth): middleware protects (app) routes"
```

---

## Task 21: Root layout + globals + (auth) layout

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/app/(auth)/layout.tsx`

- [ ] **Step 21.1: Root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broker Energetico",
  description: "Gestionale broker energetico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 21.2: Root page → redirect dashboard**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard");
}
```

- [ ] **Step 21.3: (auth) layout — center form**

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
```

- [ ] **Step 21.4: Smoke build**

```bash
pnpm build
```

Expected: build OK. Cancellabili eventuali errori di routing perché le pagine `/login` etc. non esistono ancora — ma build deve riuscire (i layout sono OK).

Se Next dà errore di pagina mancante, ignora finché non fai il Task 22.

- [ ] **Step 21.5: Commit**

```bash
git add -A
git commit -m "feat(ui): root and auth layouts"
```

---

## Task 22: Login page + form

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/components/auth/LoginForm.tsx`, `src/lib/validation/login-schema.ts`

- [ ] **Step 22.1: Schema validazione**

```ts
// src/lib/validation/login-schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password troppo corta"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 22.2: LoginForm (client component)**

```tsx
// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/login-schema";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error("Credenziali non valide");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Accedi</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email"
              {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password"
              {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Accesso..." : "Accedi"}
          </Button>
          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:underline">
              Password dimenticata?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 22.3: Login page**

```tsx
// src/app/(auth)/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 22.4: Smoke test manuale**

Crea un utente admin via Supabase Studio (`http://127.0.0.1:54323`) → Authentication → Add user.
Imposta `user_metadata`: `{"ruolo":"admin","nome_completo":"Test Admin"}` (oppure il trigger lo creerà come operatore di default).

```bash
pnpm dev
```

Vai su `http://localhost:3000/login` → inserisci credenziali → deve redirigere a `/dashboard` (che ancora non esiste, errore 404 atteso). L'auth funziona.

Stop server.

- [ ] **Step 22.5: Commit**

```bash
git add -A
git commit -m "feat(auth): login page and form"
```

---

## Task 23: Forgot/Reset password pages

**Files:**
- Create:
  - `src/app/(auth)/forgot-password/page.tsx`
  - `src/components/auth/ForgotPasswordForm.tsx`
  - `src/app/(auth)/reset-password/page.tsx`
  - `src/components/auth/ResetPasswordForm.tsx`

- [ ] **Step 23.1: ForgotPasswordForm**

```tsx
// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().email("Email non valida") });
type Input = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Input) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
    if (error) toast.error("Errore invio email");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader><CardTitle>Email inviata</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Se l'indirizzo è registrato, riceverai un link per reimpostare la password.</p>
          <Link href="/login" className="text-sm underline">Torna al login</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Reimposta password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <Button type="submit" className="w-full">Invia link di reset</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 23.2: ForgotPassword page**

```tsx
// src/app/(auth)/forgot-password/page.tsx
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
export default function Page() { return <ForgotPasswordForm />; }
```

- [ ] **Step 23.3: ResetPasswordForm (usato anche dal flow di accept-invite)**

```tsx
// src/components/auth/ResetPasswordForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  password: z.string().min(8, "Almeno 8 caratteri"),
  confirm:  z.string().min(8, "Almeno 8 caratteri"),
}).refine((d) => d.password === d.confirm, {
  message: "Le password non coincidono",
  path: ["confirm"],
});
type Input = z.infer<typeof schema>;

export function ResetPasswordForm({ title }: { title: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit(values: Input) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast.error("Errore: " + error.message);
        return;
      }
      toast.success("Password aggiornata");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">Nuova password</Label>
            <Input id="password" type="password" autoComplete="new-password"
              {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Conferma password</Label>
            <Input id="confirm" type="password" autoComplete="new-password"
              {...form.register("confirm")} />
            {form.formState.errors.confirm && (
              <p className="text-sm text-destructive">{form.formState.errors.confirm.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Salva password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 23.4: ResetPassword page**

```tsx
// src/app/(auth)/reset-password/page.tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
export default function Page() { return <ResetPasswordForm title="Reimposta password" />; }
```

- [ ] **Step 23.5: Accept invite page (riusa ResetPasswordForm)**

```tsx
// src/app/(auth)/accept-invite/page.tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function Page() {
  // Quando arriva dal link Supabase, l'utente è già loggato (token nell'URL processato dal client SDK).
  // Il form aggiorna semplicemente la password.
  return <ResetPasswordForm title="Imposta la tua password" />;
}
```

- [ ] **Step 23.6: Smoke build**

```bash
pnpm build
```

Expected: build OK, tutte le route auth presenti.

- [ ] **Step 23.7: Commit**

```bash
git add -A
git commit -m "feat(auth): forgot/reset password and accept-invite pages"
```

---

## Task 24: App layout (sidebar + topbar) + dashboard placeholder

**Files:**
- Create:
  - `src/app/(app)/layout.tsx`
  - `src/app/(app)/dashboard/page.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/TopBar.tsx`
  - `src/components/layout/UserMenu.tsx`
  - `src/components/auth/RoleGuard.tsx`

- [ ] **Step 24.1: RoleGuard**

```tsx
// src/components/auth/RoleGuard.tsx
import type { Profile, Ruolo } from "@/lib/supabase/types";

export function RoleGuard({
  ruolo, ruoli, children,
}: {
  ruolo: Profile["ruolo"] | null | undefined;
  ruoli: Ruolo[];
  children: React.ReactNode;
}) {
  if (!ruolo || !ruoli.includes(ruolo)) return null;
  return <>{children}</>;
}
```

- [ ] **Step 24.2: Sidebar**

```tsx
// src/components/layout/Sidebar.tsx
import Link from "next/link";
import { LayoutDashboard, Users, Building2, FileText, Folder, UserCog, Settings } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { Profile } from "@/lib/supabase/types";

const items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/clienti",    label: "Clienti",   icon: Users },
  { href: "/contratti",  label: "Contratti", icon: FileText },
  { href: "/documenti",  label: "Documenti", icon: Folder },
  { href: "/fornitori",  label: "Fornitori", icon: Building2 },
];

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-60 flex-col border-r bg-muted/40 md:flex">
      <div className="flex h-14 items-center border-b px-6 font-semibold">
        Broker Energetico
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
        <RoleGuard ruolo={profile.ruolo} ruoli={["admin"]}>
          <div className="my-2 border-t" />
          <Link href="/utenti" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <UserCog className="h-4 w-4" /> Utenti
          </Link>
          <Link href="/impostazioni" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Settings className="h-4 w-4" /> Impostazioni
          </Link>
        </RoleGuard>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 24.3: UserMenu**

```tsx
// src/components/layout/UserMenu.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{profile.nome_completo}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {profile.email} · <span className="capitalize">{profile.ruolo}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" /> Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 24.4: TopBar**

```tsx
// src/components/layout/TopBar.tsx
import { UserMenu } from "./UserMenu";
import type { Profile } from "@/lib/supabase/types";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div /> {/* hamburger / search globale: fase successiva */}
      <UserMenu profile={profile} />
    </header>
  );
}
```

- [ ] **Step 24.5: App layout**

```tsx
// src/app/(app)/layout.tsx
import { requireProfile } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex flex-1 flex-col">
        <TopBar profile={profile} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 24.6: Dashboard placeholder**

```tsx
// src/app/(app)/dashboard/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader><CardTitle>Benvenuto, {profile.nome_completo}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Il widget delle scadenze sarà disponibile dopo l'implementazione di contratti e documenti.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 24.7: Smoke test**

```bash
pnpm dev
```

Login → vai a `/dashboard` → deve mostrare sidebar + topbar + card di benvenuto. Stop.

- [ ] **Step 24.8: Commit**

```bash
git add -A
git commit -m "feat(ui): app layout sidebar topbar and dashboard placeholder"
```

---

## Task 25: Utenti list page (admin only)

**Files:**
- Create: `src/app/(app)/utenti/page.tsx`, `src/components/utenti/UtentiTable.tsx`

- [ ] **Step 25.1: UtentiTable**

```tsx
// src/components/utenti/UtentiTable.tsx
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Profile } from "@/lib/supabase/types";

const RUOLO_VARIANT: Record<Profile["ruolo"], "default" | "secondary" | "outline"> = {
  admin: "default",
  commerciale: "secondary",
  operatore: "outline",
};

export function UtentiTable({ profiles }: { profiles: Profile[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Nessun utente.
            </TableCell>
          </TableRow>
        )}
        {profiles.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.nome_completo}</TableCell>
            <TableCell className="text-muted-foreground">{p.email}</TableCell>
            <TableCell>
              <Badge variant={RUOLO_VARIANT[p.ruolo]} className="capitalize">{p.ruolo}</Badge>
            </TableCell>
            <TableCell>
              {p.attivo ? "Attivo" : <span className="text-muted-foreground">Disattivato</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 25.2: Utenti page**

```tsx
// src/app/(app)/utenti/page.tsx
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UtentiTable } from "@/components/utenti/UtentiTable";

export default async function Page() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utenti</h1>
        <Button asChild>
          <Link href="/utenti/invita"><UserPlus className="mr-2 h-4 w-4" /> Invita utente</Link>
        </Button>
      </div>
      <Card><CardContent className="p-0"><UtentiTable profiles={data ?? []} /></CardContent></Card>
    </div>
  );
}
```

- [ ] **Step 25.3: Smoke test**

`pnpm dev` → login come admin → vai a `/utenti` → mostra te stesso in lista. Login come non-admin → `/utenti` → redirect a `/dashboard?forbidden=1`.

- [ ] **Step 25.4: Commit**

```bash
git add -A
git commit -m "feat(utenti): admin-only list page"
```

---

## Task 26: Server Action invito utente

**Files:**
- Create: `src/lib/auth/invite-action.ts`, `src/lib/validation/invito-schema.ts`

- [ ] **Step 26.1: Schema**

```ts
// src/lib/validation/invito-schema.ts
import { z } from "zod";

export const invitoSchema = z.object({
  email: z.string().email("Email non valida"),
  nome_completo: z.string().min(2, "Nome troppo corto"),
  ruolo: z.enum(["admin", "commerciale", "operatore"]),
});

export type InvitoInput = z.infer<typeof invitoSchema>;
```

- [ ] **Step 26.2: Server Action**

```ts
// src/lib/auth/invite-action.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { invitoSchema, type InvitoInput } from "@/lib/validation/invito-schema";

export type InvitoResult =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<keyof InvitoInput, string>> };

export async function invitaUtente(input: InvitoInput): Promise<InvitoResult> {
  await requireRole("admin");

  const parsed = invitoSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Partial<Record<keyof InvitoInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof InvitoInput;
      if (k && !fields[k]) fields[k] = issue.message;
    }
    return { ok: false, error: "Dati non validi", fields };
  }

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      ruolo: parsed.data.ruolo,
      nome_completo: parsed.data.nome_completo,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/utenti");
  return { ok: true };
}
```

- [ ] **Step 26.3: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 26.4: Commit**

```bash
git add -A
git commit -m "feat(utenti): server action invitaUtente"
```

---

## Task 27: Form invito utente (UI)

**Files:**
- Create: `src/app/(app)/utenti/invita/page.tsx`, `src/components/utenti/InvitaUtenteForm.tsx`

- [ ] **Step 27.1: InvitaUtenteForm**

```tsx
// src/components/utenti/InvitaUtenteForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { invitoSchema, type InvitoInput } from "@/lib/validation/invito-schema";
import { invitaUtente } from "@/lib/auth/invite-action";

export function InvitaUtenteForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<InvitoInput>({
    resolver: zodResolver(invitoSchema),
    defaultValues: { email: "", nome_completo: "", ruolo: "operatore" },
  });

  async function onSubmit(values: InvitoInput) {
    setSubmitting(true);
    try {
      const res = await invitaUtente(values);
      if (!res.ok) {
        if (res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof InvitoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success("Invito inviato");
      router.push("/utenti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome completo</Label>
            <Input id="nome_completo" {...form.register("nome_completo")} />
            {form.formState.errors.nome_completo && (
              <p className="text-sm text-destructive">{form.formState.errors.nome_completo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruolo">Ruolo</Label>
            <select
              id="ruolo"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("ruolo")}
            >
              <option value="admin">Admin</option>
              <option value="commerciale">Commerciale</option>
              <option value="operatore">Operatore</option>
            </select>
            {form.formState.errors.ruolo && (
              <p className="text-sm text-destructive">{form.formState.errors.ruolo.message}</p>
            )}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Invio in corso..." : "Invia invito"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 27.2: Page**

```tsx
// src/app/(app)/utenti/invita/page.tsx
import { requireRole } from "@/lib/auth/session";
import { InvitaUtenteForm } from "@/components/utenti/InvitaUtenteForm";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Invita un utente</h1>
      <InvitaUtenteForm />
    </div>
  );
}
```

- [ ] **Step 27.3: Smoke test manuale**

`pnpm dev` → login admin → `/utenti/invita` → invia invito a una mail di test (in dev Supabase intercetta le email; le vedi in `http://127.0.0.1:54324`) → conferma redirect a `/utenti` con toast.

- [ ] **Step 27.4: Commit**

```bash
git add -A
git commit -m "feat(utenti): invite form ui"
```

---

## Task 28: E2E smoke test login (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/auth.spec.ts`, `scripts/seed-dev-users.ts`
- Modify: `package.json`

- [ ] **Step 28.1: Installare browser Playwright**

```bash
pnpm dlx playwright install chromium
```

- [ ] **Step 28.2: `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 28.3: Script seed dev users**

```ts
// scripts/seed-dev-users.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type SeedUser = { email: string; password: string; ruolo: "admin" | "commerciale" | "operatore"; nome: string };

const users: SeedUser[] = [
  { email: "admin@dev.local",       password: "Password123!", ruolo: "admin",       nome: "Admin Dev" },
  { email: "commerciale@dev.local", password: "Password123!", ruolo: "commerciale", nome: "Commerciale Dev" },
  { email: "operatore@dev.local",   password: "Password123!", ruolo: "operatore",   nome: "Operatore Dev" },
];

async function main() {
  const svc = createClient(url, serviceKey);
  for (const u of users) {
    const existing = await svc.auth.admin.listUsers();
    const found = existing.data.users.find((x) => x.email === u.email);
    if (found) {
      console.log(`skip ${u.email} (already exists)`);
      continue;
    }
    const { error } = await svc.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { ruolo: u.ruolo, nome_completo: u.nome },
    });
    if (error) {
      console.error(`fail ${u.email}: ${error.message}`);
      process.exit(1);
    }
    console.log(`ok ${u.email}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Aggiungi a `package.json` scripts:

```json
"db:seed:users": "tsx scripts/seed-dev-users.ts"
```

- [ ] **Step 28.4: Test E2E**

```ts
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("admin can login and reach dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@dev.local");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
```

- [ ] **Step 28.5: Run E2E**

```bash
pnpm db:reset && pnpm db:seed:users && pnpm test:e2e
```

Expected: 2 passed.

- [ ] **Step 28.6: Commit**

```bash
git add -A
git commit -m "test(e2e): playwright smoke for login"
```

---

## Task 29: CI workflow GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 29.1: Workflow**

```yaml
# .github/workflows/ci.yml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      - name: Start Supabase local
        run: pnpm dlx supabase start

      - name: Wait for Supabase + apply migrations
        run: pnpm dlx supabase db reset

      - name: Export Supabase env for tests
        run: |
          status=$(pnpm dlx supabase status --output json)
          echo "NEXT_PUBLIC_SUPABASE_URL=$(echo "$status" | jq -r '.API_URL')" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(echo "$status" | jq -r '.ANON_KEY')" >> $GITHUB_ENV
          echo "SUPABASE_SERVICE_ROLE_KEY=$(echo "$status" | jq -r '.SERVICE_ROLE_KEY')" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> $GITHUB_ENV

      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm test:rls
      - run: pnpm build

      - name: Stop Supabase
        if: always()
        run: pnpm dlx supabase stop --no-backup
```

E2E in Playwright lo aggiungiamo in CI nel Plan #4 (richiede browser e server avviato, allunga la run; per ora sufficiente eseguirlo localmente prima di mergeare).

- [ ] **Step 29.2: Test che la pipeline è valida sintatticamente**

```bash
pnpm dlx --package=@github/actions-validator gh-actions-validator .github/workflows/ci.yml || true
```

(Lo step `|| true` evita il fail se l'utility non è installata; il check effettivo è quando GitHub esegue la workflow.)

- [ ] **Step 29.3: Commit**

```bash
git add -A
git commit -m "ci: github actions for typecheck lint test build"
```

---

## Task 30: README

**Files:**
- Create: `README.md`

- [ ] **Step 30.1: README**

```md
# Broker Energetico

Gestionale interno per broker energetico. Stack: Next.js 16 + Supabase.

## Setup dev

Richiesti: Node 22, pnpm 9, Docker (per Supabase locale), Supabase CLI.

```bash
cp .env.example .env.local
pnpm install
pnpm db:start
pnpm db:reset
pnpm db:types
pnpm db:seed:users
pnpm dev
```

App: http://localhost:3000  ·  Studio: http://127.0.0.1:54323  ·  Email locale: http://127.0.0.1:54324

Utenti seed:
- admin@dev.local / Password123!
- commerciale@dev.local / Password123!
- operatore@dev.local / Password123!

## Comandi utili

| Comando | Cosa fa |
|---|---|
| `pnpm dev` | dev server con turbopack |
| `pnpm build` | build di produzione |
| `pnpm test` | test unit |
| `pnpm test:rls` | test RLS contro DB locale |
| `pnpm test:e2e` | E2E con Playwright |
| `pnpm db:reset` | reset DB locale + applica migrazioni |
| `pnpm db:types` | rigenera `src/types/database.ts` |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm lint` | eslint |
| `pnpm format` | prettier --write |

## Documentazione

- Spec di prodotto: [docs/superpowers/specs/2026-05-06-broker-energetico-design.md](docs/superpowers/specs/2026-05-06-broker-energetico-design.md)
- Design system UI: [DESIGN.md](DESIGN.md)
- Plan corrente: [docs/superpowers/plans/2026-05-06-broker-foundation-auth.md](docs/superpowers/plans/2026-05-06-broker-foundation-auth.md)
```

- [ ] **Step 30.2: Commit**

```bash
git add README.md
git commit -m "docs: add readme with dev setup"
```

---

## Acceptance Criteria del Plan #1

Al termine del plan, devono essere veri:

- [ ] `pnpm typecheck` passa con 0 errori
- [ ] `pnpm lint` passa
- [ ] `pnpm test` passa (unit)
- [ ] `pnpm test:rls` passa (≥6 file di test, copre tutte le tabelle)
- [ ] `pnpm test:e2e` passa con 2 test (login + redirect)
- [ ] `pnpm build` riesce
- [ ] Login funziona end-to-end con utenti seed
- [ ] Admin può invitare un utente; il nuovo utente riceve email (visibile in inbucket dev), accetta invito, imposta password, viene redirezionato a `/dashboard`
- [ ] Non-admin non vede `/utenti` (redirect a `/dashboard?forbidden=1`)
- [ ] Non-loggato non vede `/dashboard` (redirect a `/login?next=/dashboard`)
- [ ] CI workflow `.github/workflows/ci.yml` presente

---

**Fine Plan #1.** Il prossimo plan (`2026-05-XX-broker-anagrafiche.md`) si scrive a valle del completamento di questo, partendo dallo stato reale del codice.
