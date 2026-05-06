# Broker Energetico

Gestionale interno per broker energetico. Stack: Next.js 16 + Supabase remoto.

## Setup dev

Richiesti: Node 22, pnpm 9, Supabase CLI.

Pre-step (una sola volta per developer):
```bash
pnpm dlx supabase login                    # interattivo, autentica la CLI
```

Setup progetto:
```bash
cp .env.example .env.local                 # poi popolare le keys (vedi Dashboard → Settings → API)
pnpm install
pnpm db:link                               # link al progetto remoto szkcpcqedikyhrxziuwu
pnpm db:push                               # applica le migrazioni al DB remoto (idempotente)
pnpm db:types                              # rigenera tipi TS
pnpm db:seed:users                         # crea i 3 utenti dev nel progetto remoto (Task 28)
pnpm dev
```

App: http://localhost:3000  ·  Supabase Studio: https://supabase.com/dashboard/project/szkcpcqedikyhrxziuwu

Utenti seed (creati nel progetto remoto):
- admin@dev.local / Password123!
- commerciale@dev.local / Password123!
- operatore@dev.local / Password123!

## Comandi utili

| Comando | Cosa fa |
|---|---|
| `pnpm dev` | dev server con turbopack |
| `pnpm build` | build di produzione |
| `pnpm test` | test unit |
| `pnpm test:rls` | test RLS contro DB remoto (crea/cancella utenti `test-*@example.com`) |
| `pnpm test:e2e` | E2E con Playwright |
| `pnpm db:push` | applica migrazioni nuove al DB remoto |
| `pnpm db:diff` | mostra differenze tra schema locale e remoto |
| `pnpm db:types` | rigenera `src/types/database.ts` dal remoto |
| `pnpm db:link` | link al progetto remoto |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm lint` | eslint |
| `pnpm format` | prettier --write |

## Documentazione

- Spec di prodotto: [docs/superpowers/specs/2026-05-06-broker-energetico-design.md](docs/superpowers/specs/2026-05-06-broker-energetico-design.md)
- Design system UI: [DESIGN.md](DESIGN.md)
- Plan corrente: [docs/superpowers/plans/2026-05-06-broker-foundation-auth.md](docs/superpowers/plans/2026-05-06-broker-foundation-auth.md)
