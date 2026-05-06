# Broker Energetico — Design Document

**Data:** 2026-05-06
**Autore:** Ivan Signorile (Barikreativa)
**Stato:** Approvato in brainstorming, in attesa di review formale

---

## 1. Contesto

Il committente è un **broker energetico** che si appoggia a circa **15 fornitori** per offrire ai propri clienti il miglior contratto disponibile. Si occupa di:

- consulenza commerciale e proposta del contratto migliore
- post-vendita: ricontatto dei clienti per i contratti in scadenza

**Volumi attuali:** ~600 clienti attivi (120 aziende + 480 privati).

**Necessità operativa:** un gestionale interno che renda efficiente la gestione, in particolare delle **scadenze** (contratti e documenti d'identità).

## 2. Obiettivi del MVP

- Anagrafica clienti (privato/azienda) con geolocalizzazione
- Anagrafica fornitori
- Gestione contratti per cliente (incluso allegato PDF)
- Gestione documenti per cliente (incluso allegato PDF, scadenza opzionale)
- Dashboard scadenze con filtri
- Notifica automatica email per scadenze (digest giornaliero)
- Ricerca, filtri, export CSV

**Non in scope MVP:** area cliente self-service, app mobile, fatturazione, CRM avanzato (pipeline vendita), reportistica direzionale, multi-tenancy.

## 3. Decisioni chiave

| Area | Scelta |
|---|---|
| Stack | Next.js (App Router) + Supabase |
| Hosting | Vercel (region `fra1`) |
| Email | Resend |
| Geocoding | Nominatim/OSM (free) |
| Backup PDF | Backblaze B2 (S3-compatible) |
| UI | shadcn/ui + Tailwind, design system generato da `npx getdesign@latest add cohere` (`DESIGN.md` come fonte di verità) |
| Lingua | Italiano (no i18n) |
| Auth | Supabase Auth, email + password, invito da admin |
| Ruoli | admin / commerciale / operatore |
| Notifiche | Digest giornaliero via cron |

## 4. Architettura ad alto livello

```
┌─────────────────────────────────────────────────────────┐
│  Browser (admin / commerciale / operatore)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
        ┌────────────────▼─────────────────┐
        │  Next.js App Router (Vercel)     │
        │  - Server Components             │
        │  - Server Actions (mutazioni)    │
        │  - Route Handlers (cron)         │
        └────┬───────────────┬─────────────┘
             │               │
   ┌─────────▼────┐    ┌─────▼────────┐    ┌──────────────┐
   │   Supabase   │    │   Resend     │    │  Nominatim   │
   │ • Postgres   │    │ • Email API  │    │ • Geocoding  │
   │ • Auth       │    └──────────────┘    └──────────────┘
   │ • Storage    │
   │ • RLS        │    ┌──────────────┐
   └──────────────┘    │ Backblaze B2 │
                       │ • PDF backup │
                       └──────────────┘
```

**Principi:**
- Una sola app Next.js, no monorepo
- Tutte le mutazioni passano da **Server Actions** (auth via cookie HttpOnly Supabase)
- **RLS attiva su tutte le tabelle** — la sicurezza è nel DB, non nell'app
- Storage Supabase **privato**; download via URL firmato a 60 secondi
- Cron Vercel chiama Route Handler protetto da `CRON_SECRET`
- Nominatim e Resend chiamati esclusivamente server-side

## 5. Modello dati

### 5.1 Enum

```
ruolo:                admin | commerciale | operatore
tipo_cliente:         privato | azienda
mercato:              libero | tutelato
stato_contratto:      bozza | attivo | scaduto | rinnovato | annullato
                      (in_scadenza è derivato, non stored)
categoria_contratto:  energia | rinnovabili | riscaldamento | utility | servizi
tipo_contratto:       luce | gas | dual_fuel | fotovoltaico | accumulo |
                      comunita_energetica | ricarica_ev |
                      teleriscaldamento | gpl | pellet |
                      idrico | internet_fibra | telefonia |
                      efficienza_energetica | diagnosi_energetica |
                      manutenzione | assicurativo
tipo_documento:       carta_identita | passaporto | patente | permesso_soggiorno |
                      codice_fiscale | tessera_sanitaria | partita_iva |
                      visura_camerale | certificato_attribuzione_piva |
                      bolletta_recente | delega_voltura | mandato_consulenza |
                      privacy_gdpr | iban | rid_sepa | altro
```

### 5.2 Tabelle

```
profiles
─────────
id              uuid PK, FK → auth.users.id
ruolo           ruolo NOT NULL
nome_completo   text NOT NULL
email           text NOT NULL
attivo          bool NOT NULL DEFAULT true
created_at, updated_at

clienti
─────────
id              uuid PK
tipo_cliente    tipo_cliente NOT NULL
nome            text NOT NULL          -- privato: "Nome Cognome"; azienda: "Ragione Sociale"
email           text
telefono        text
indirizzo       text                   -- riga unica formattata
lat             numeric                -- geocoded o manuale
lng             numeric                -- geocoded o manuale
note            text
commerciale_id  uuid FK → profiles.id  -- nullable, ownership solo per ruolo commerciale
created_at, updated_at, created_by uuid FK → profiles.id

fornitori
─────────
id              uuid PK
nome            text NOT NULL UNIQUE
contatti        jsonb                  -- { referente, email, telefono, ... }
note            text
attivo          bool NOT NULL DEFAULT true
created_at, updated_at

contratti
─────────
id              uuid PK
cliente_id      uuid FK → clienti.id NOT NULL
fornitore_id    uuid FK → fornitori.id NOT NULL
categoria       categoria_contratto NOT NULL
tipo            tipo_contratto NOT NULL
mercato         mercato                -- nullable
pod             text                   -- nullable, per luce
pdr             text                   -- nullable, per gas
data_inizio     date NOT NULL
data_scadenza   date NOT NULL          -- INDEX
stato           stato_contratto NOT NULL
allegato_path   text                   -- path nel bucket
note            text
replaced_by_id  uuid FK → contratti.id -- usato quando stato = rinnovato
created_at, updated_at, created_by uuid FK → profiles.id

documenti
─────────
id              uuid PK
cliente_id      uuid FK → clienti.id NOT NULL
tipo            tipo_documento NOT NULL
descrizione     text                   -- obbligatoria solo se tipo = altro
file_path       text NOT NULL
data_scadenza   date                   -- nullable; se valorizzata → entra nel digest. INDEX
note            text
created_at, updated_at, created_by uuid FK → profiles.id

notifiche_log
─────────
id              uuid PK
entity_type     text NOT NULL          -- 'contratto' | 'documento'
entity_id       uuid NOT NULL
soglia          int NOT NULL           -- 60 | 30 | 15 | 0
recipient_email text NOT NULL
sent_at         timestamptz NOT NULL DEFAULT now()
UNIQUE (entity_type, entity_id, soglia, recipient_email)

cron_runs
─────────
id              uuid PK
job_name        text NOT NULL          -- 'daily-digest' | 'weekly-backup'
run_at          timestamptz NOT NULL DEFAULT now()
ok              bool NOT NULL
summary         jsonb                  -- { utenti_notificati, email_inviate, errori }
```

### 5.3 View derivata

```sql
CREATE VIEW v_contratti AS
SELECT c.*,
       (c.data_scadenza - CURRENT_DATE) AS giorni_alla_scadenza,
       (c.stato = 'attivo'
         AND c.data_scadenza <= CURRENT_DATE + INTERVAL '60 days'
         AND c.data_scadenza >= CURRENT_DATE) AS is_in_scadenza
FROM contratti c;
```

`is_in_scadenza` non è stored — UI e filtri leggono dalla view.

### 5.4 Indici

- `clienti(commerciale_id)`
- `clienti(email)`
- `contratti(cliente_id)`
- `contratti(stato)`
- `contratti(data_scadenza)`
- `documenti(cliente_id)`
- `documenti(data_scadenza)` WHERE data_scadenza IS NOT NULL

## 6. Autenticazione e RLS

### 6.1 Flusso auth

1. **Bootstrap iniziale**: primo admin creato via script seed
2. **Invito utente** (solo admin): form `email + ruolo` → `supabase.auth.admin.inviteUserByEmail()` con `user_metadata.ruolo` → email Supabase con link setup password
3. **Trigger DB** `on_auth_user_created` crea riga `profiles` leggendo `user_metadata.ruolo` (default `operatore` se assente)
4. **Login**: email + password → cookie HttpOnly Supabase → middleware Next.js verifica sessione su tutte le route protette
5. **Reset password**: magic link via Supabase

### 6.2 Helper di sessione

```ts
// lib/auth/session.ts
getCurrentProfile(): Promise<Profile | null>
requireRole(...roles: Ruolo[]): Promise<Profile>  // throw redirect se non autorizzato
isAdmin(profile): boolean
isCommerciale(profile): boolean
isOperatore(profile): boolean
```

### 6.3 Funzione SQL helper

```sql
CREATE FUNCTION current_ruolo() RETURNS ruolo AS $$
  SELECT ruolo FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 6.4 Politiche RLS

**`profiles`**
- SELECT: tutti gli autenticati
- INSERT/UPDATE/DELETE: solo `admin`

**`clienti`**
- SELECT:
  - admin, operatore → tutti
  - commerciale → `commerciale_id = auth.uid() OR commerciale_id IS NULL`
- INSERT: tutti i ruoli (commerciale può solo settare `commerciale_id` a sé stesso o lasciarlo null)
- UPDATE: stessa regola della SELECT
- DELETE: solo `admin`

**`fornitori`**
- SELECT: tutti
- INSERT/UPDATE/DELETE: solo `admin`

**`contratti`** e **`documenti`**
- SELECT/INSERT/UPDATE: regola si appoggia al `cliente_id`, applicando la stessa logica di `clienti`
- DELETE: solo `admin`

**`notifiche_log`**
- SELECT: solo `admin`
- INSERT/UPDATE/DELETE: nessun utente; scrive solo il cron via service role key

**`cron_runs`**
- SELECT: solo `admin`
- INSERT: solo cron (service role)

### 6.5 Storage RLS (bucket `documents`)

- Bucket privato
- Policy SELECT/INSERT/UPDATE/DELETE estraggono `cliente_id` dal primo segmento del path: `(storage.foldername(name))[1]::uuid` → join con `clienti` → applica le stesse regole della tabella

### 6.6 Sicurezza operativa

- `SUPABASE_SERVICE_ROLE_KEY` mai esposta al browser; usata solo nei Route Handler `/api/cron/*` e in script di seed
- `CRON_SECRET` verificato come `Authorization: Bearer <secret>` su tutti gli endpoint cron
- Validazione PDF: MIME `application/pdf` + magic bytes `%PDF` server-side prima dello storage upload
- Audit minimo: `created_by` su clienti / contratti / documenti

## 7. UI: route, layout, componenti

### 7.1 Route

```
PUBBLICHE
  /login
  /accept-invite          # link dalle email di invito
  /forgot-password
  /reset-password

PROTETTE (middleware)
  /                       → redirect /dashboard
  /dashboard              KPI + widget scadenze imminenti
  /clienti                lista, filtri, ricerca
  /clienti/nuovo
  /clienti/[id]           tabs: Anagrafica · Contratti · Documenti · Mappa · Note
  /clienti/[id]/modifica
  /contratti              lista globale, filtri (stato, fornitore, scadenza)
  /contratti/nuovo        ?cliente=…
  /contratti/[id]
  /contratti/[id]/modifica
  /documenti              lista globale, filtri (tipo, scadenza)
  /documenti/[id]/modifica
  /fornitori              read tutti, edit solo admin
  /fornitori/nuovo        solo admin
  /fornitori/[id]
  /utenti                 solo admin
  /utenti/invita          solo admin
  /impostazioni           solo admin: trigger digest manuale, soglie, dominio mittente

API
  /api/cron/daily-digest  Authorization Bearer CRON_SECRET
  /api/cron/weekly-backup Authorization Bearer CRON_SECRET
```

### 7.2 Layout

```
┌────────────────────────────────────────────────────┐
│ TopBar: Logo | Ricerca globale | User menu         │
├──────────┬─────────────────────────────────────────┤
│ Sidebar  │  Page content                           │
│  Dashb.  │                                         │
│  Clienti │                                         │
│  Contr.  │                                         │
│  Docum.  │                                         │
│  Fornit. │                                         │
│  Utenti* │                                         │
│  Impost.*│  *solo admin                            │
└──────────┴─────────────────────────────────────────┘
```

Sidebar collassabile, drawer su mobile.

### 7.3 Componenti chiave

| Componente | Uso |
|---|---|
| `<DataTable>` | wrapper TanStack Table con sort/filter/pagination, usato in tutte le liste |
| `<ScadenzaBadge giorni={n}>` | pill colorata: verde >60, giallo 60-30, arancio 30-15, rosso ≤15, grigio scaduto |
| `<ClienteForm>` | react-hook-form + zod, geocoding on-blur sull'indirizzo, fallback lat/lng manuali |
| `<ContrattoForm>` | gestione condizionale POD/PDR a seconda del tipo |
| `<DocumentoForm>` | upload PDF, validazione client+server, scadenza obbligatoria per identità |
| `<UploadPdf>` | drag&drop, validazione magic bytes server-side, progress |
| `<MappaCliente lat lng>` | Leaflet + tile OSM (no API key) |
| `<ExportCsvButton>` | Server Action genera CSV streaming |
| `<RoleGuard ruoli>` | nasconde elementi UI a ruoli non autorizzati (sicurezza vera in RLS) |
| `<ScadenzeWidget>` | dashboard: tabella raggruppata per soglia 60/30/15/0 |

### 7.4 Pattern tecnici

- **Liste e dettagli** → Server Components (fetch diretto Supabase server-side)
- **Mutazioni** → Server Actions con schema **Zod condiviso** (validazione identica client+server)
- **Optimistic UI** dove utile (toggle attivo/disattivo, eliminazioni reversibili)
- **Skeletons** per le sezioni async, `Suspense` boundary
- **Toast** via `sonner` per feedback azioni
- `DESIGN.md` da `getdesign cohere` è la fonte di verità per palette, scala tipografica, spacing, radius, ombre

### 7.5 Default UI per scadenza documento

- `carta_identita`, `passaporto`, `patente`, `permesso_soggiorno`, `visura_camerale` → form **richiede** `data_scadenza`
- Altri tipi → `data_scadenza` opzionale, vuota di default

## 8. Geocoding

### 8.1 Provider

- **Nominatim pubblico** (`https://nominatim.openstreetmap.org`)
- Header obbligatorio: `User-Agent: ${NOMINATIM_USER_AGENT}`
- Param `countrycodes=it` per ridurre falsi positivi
- Timeout 5s; rate limit 1 req/sec (rispettato di fatto dal volume basso)

### 8.2 Flow al salvataggio cliente

```
[Server Action saveCliente]
  ├─ valida Zod
  ├─ se utente ha valorizzato lat e lng → bypass Nominatim, usa quelli
  ├─ se solo uno dei due valorizzato → errore di validazione
  ├─ se entrambi vuoti E indirizzo cambiato/nuovo:
  │     geocodeAddress(indirizzo)
  │     ├─ success → { lat, lng }
  │     └─ failure → log warning, lat/lng = null, salvataggio comunque ok
  ├─ UPDATE clienti …
  └─ toast (con messaggio differenziato a seconda dell'esito geocoding)
```

### 8.3 Pulsante "Ricalcola coordinate"

Nella scheda cliente sezione "Mappa": forza nuova chiamata Nominatim, azzera eventuali lat/lng manuali. Disponibile a ruoli che possono editare il cliente.

### 8.4 Firma funzione

```ts
// lib/geocoding/nominatim.ts
type GeocodeResult = { lat: number; lng: number } | null;
async function geocodeAddress(indirizzo: string): Promise<GeocodeResult>;
```

Wrapper `geocodeOrLog` cattura tutte le eccezioni → la mutazione cliente non fallisce mai per colpa del geocoding.

## 9. Cron + digest email

### 9.1 Schedule

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 6 * * *" },
    { "path": "/api/cron/weekly-backup", "schedule": "0 2 * * 0" }
  ]
}
```

⚠️ Vercel Cron usa **UTC**. `0 6 * * *` UTC = 08:00 IT (CEST estate) / 07:00 IT (CET inverno). Default sensato per recapito prima dell'inizio lavoro.

### 9.2 Endpoint

```
GET /api/cron/daily-digest
Header: Authorization: Bearer ${CRON_SECRET}
Response 200: { utenti_notificati, email_inviate, errori }
```

Vercel Cron invia automaticamente l'header se `CRON_SECRET` è configurata in env (best practice Vercel).

**Trigger manuale admin:** pulsante "Invia digest ora" su `/impostazioni` chiama lo stesso endpoint server-side (utile per recupero giorni saltati e per debug).

### 9.3 Pipeline

```
1. FETCH scadenze imminenti
   - contratti con stato='attivo' AND data_scadenza IN
     {oggi, oggi+15, oggi+30, oggi+60}
   - documenti con data_scadenza IN
     {oggi, oggi+15, oggi+30, oggi+60}

2. DETERMINA SOGLIA per ogni record (0 | 15 | 30 | 60)
   Soglie esatte, non range.

3. PER OGNI UTENTE attivo:
   - admin → tutte le scadenze
   - operatore → tutte le scadenze
   - commerciale → solo scadenze di clienti dove commerciale_id = utente.id

4. FILTRO IDEMPOTENZA
   - skip (entity, soglia, recipient_email) già presenti in notifiche_log

5. SE l'utente ha almeno 1 scadenza nuova:
   - render template Resend (React Email)
   - invio
   - INSERT in notifiche_log per ognuna delle scadenze incluse

6. ERROR HANDLING
   - eccezioni per singolo utente non interrompono il job
   - log strutturato Vercel
   - risposta 200 anche con errori parziali (summary)
   - eccezione fatale (DB down) → 500, retry policy Vercel

7. AUDIT su `cron_runs`
```

### 9.4 Soglie esatte: razionale

- Una scadenza viene notificata **al massimo 4 volte per destinatario** nella sua vita (60, 30, 15, 0 giorni). Con N utenti, la cardinalità massima in `notifiche_log` per quella scadenza è 4·N.
- `notifiche_log` ha cardinalità prevedibile e bounded
- Trade-off: se il cron salta un giorno, quella soglia di quel giorno è persa. Mitigato dal widget dashboard sempre aggiornato e dalle soglie successive.

### 9.5 Email

- **Mittente**: `digest@<dominio_broker>` (verificato su Resend in setup)
- **Subject**: `Scadenze del giorno · N contratti, M documenti`
- **Body**: tabella raggruppata per soglia (rosso/arancio/giallo/verde) con: nome cliente (link), tipo, dettaglio, giorni residui, CTA "Apri nell'app"
- Footer: link "gestisci notifiche" (placeholder, fase 2)
- Render: React Email + Resend SDK

## 10. Storage e backup

### 10.1 Bucket Supabase

Un solo bucket: **`documents`**, **privato**.

Path:
```
documents/
  {cliente_id}/
    contratti/{contratto_id}/{uuid}.pdf
    documenti/{documento_id}/{uuid}.pdf
```

### 10.2 Pipeline upload

```
[Server Action uploadAllegato]
  ├─ requireRole(admin, commerciale, operatore)
  ├─ RLS verifica accesso al cliente
  ├─ valida MIME (application/pdf)
  ├─ valida size (<= MAX_UPLOAD_MB, default 10)
  ├─ valida magic bytes (%PDF)
  ├─ upload nel bucket: {cliente_id}/{tipo}/{record_id}/{uuid}.pdf
  ├─ UPDATE record (allegato_path o file_path)
  └─ ritorna risultato strutturato
```

### 10.3 Download

Mai link diretto. Server Action `getDownloadUrl(recordId)`:
1. carica record (RLS verifica accesso)
2. `supabase.storage.createSignedUrl(path, 60)`
3. ritorna URL al client → browser apre → download → URL scade dopo 60s

### 10.4 Sostituzione e cancellazione

- **Sostituisci**: nuovo upload → UPDATE record → DELETE vecchio file (best-effort; orfani gestiti da housekeeping futuro)
- **Elimina record** (solo admin): DELETE record → DELETE file dal bucket

### 10.5 Backup PDF su Backblaze B2

- **Schedule**: settimanale, domenica notte (`0 2 * * 0` UTC)
- **Endpoint**: `/api/cron/weekly-backup`
- **Logica**:
  - lista file dal bucket Supabase
  - sync incrementale verso bucket B2 (skip file già presenti)
  - object versioning B2 nativo, retention 90 giorni
- **Restore**: nessuna UI in MVP. Restore = script CLI manuale (`pnpm restore:pdf <date>`)
- **Monitoraggio**: log su `cron_runs`. Se la run fallisce, alert via Resend all'admin.

## 11. Testing

**Approccio:** test mirati dove l'errore costa caro, non copertura per la copertura.

| Tipo | Tool | Cosa |
|---|---|---|
| Unit | Vitest | `geocodeAddress`, validatori Zod, helper auth, calcolo `giorni_alla_scadenza`, idempotenza digest |
| DB / RLS | Vitest + supabase-js con utenti di test | tre client (admin, commerciale1, commerciale2): commerciale1 NON vede clienti di commerciale2 |
| Integration | Vitest + `supabase start` locale | pipeline cron end-to-end: seed scadenze → chiamata endpoint → verifica `notifiche_log` + email mockata |
| E2E (smoke) | Playwright | login → crea cliente con geocoding → upload PDF; login → crea contratto → vedi in dashboard scadenze; login admin → invita utente |

**TDD:** sì per la logica del cron e per le policy RLS (entrambi alto costo di errore). Per il resto, test scritti insieme/dopo l'implementazione.

**Cosa non testiamo formalmente:** rendering UI minore, componenti shadcn upstream, copy text.

## 12. Deployment, secrets, observability

### 12.1 Ambienti

| Ambiente | Configurazione |
|---|---|
| Dev | Next.js dev server + Supabase CLI **linked** al progetto remoto (`szkcpcqedikyhrxziuwu`, region `eu-west-1`). Niente Docker locale. |
| Preview | Branch deploy Vercel + Supabase Database Branch (DB isolato per branch git, attivabile in fase 2 con piano Pro) |
| Production | Vercel `fra1` + Supabase progetto `szkcpcqedikyhrxziuwu` |

**Razionale dev remoto:** team piccolo, schema condiviso, nessun overhead Docker. Tutti gli sviluppatori puntano alla stessa istanza durante MVP. I test RLS creano utenti con prefisso `test-{uuid}@example.com` e li cancellano in `afterAll` per isolamento. Quando il team cresce o si va in produzione effettiva, si abilita Database Branching o si crea un secondo progetto `broker-energetico-dev`.

### 12.2 CI (GitHub Actions su PR)

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:rls` (contro DB di test in CI con `supabase start`)
- `pnpm build`

Merge bloccato se uno fallisce.

### 12.3 Variabili d'ambiente

```
# Pubbliche (NEXT_PUBLIC_*)
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server-only
SUPABASE_SERVICE_ROLE_KEY      # solo cron + script seed
CRON_SECRET                    # auth endpoint cron
RESEND_API_KEY
RESEND_FROM_EMAIL              # es. digest@broker.tuodominio.it
NOMINATIM_USER_AGENT           # "BrokerEnergetico/1.0 (ivan@barikreativa.com)"
MAX_UPLOAD_MB                  # default 10
B2_KEY_ID
B2_APPLICATION_KEY
B2_BUCKET
B2_BUCKET_ID
B2_ENDPOINT                    # es. s3.eu-central-003.backblazeb2.com
```

Gestione: `vercel env` per Production/Preview, `.env.local` per dev. Mai committate.

### 12.4 Observability

- **Vercel logs** per Server Actions, Route Handlers, errori build
- **Supabase logs** per query slow + errori RLS
- **Resend dashboard** per delivery email
- Tabella `cron_runs` come audit interno (visibile in `/impostazioni`)

## 13. Out of scope MVP / Fase 2

- Area cliente self-service
- App mobile / PWA
- Pipeline vendita (lead, opportunità, conversioni)
- Reportistica direzionale (KPI, grafici, time series)
- 2FA TOTP per gli utenti (aggiungibile a basso costo se serve)
- UI restore backup PDF (in MVP solo CLI)
- Housekeeping automatico file orfani nel bucket
- Documentazione runbook rotazione secrets
- Multi-tenancy (più broker sulla stessa istanza)
- Integrazioni con CRM esterni / centralino / WhatsApp Business

## 14. Glossario

- **POD** — Point Of Delivery, codice univoco fornitura elettrica
- **PDR** — Punto Di Riconsegna, codice univoco fornitura gas
- **Mercato libero / tutelato** — regime tariffario italiano gas/luce
- **Voltura** — cambio intestatario di una fornitura
- **CER** — Comunità Energetica Rinnovabile

---

**Fine documento.**
