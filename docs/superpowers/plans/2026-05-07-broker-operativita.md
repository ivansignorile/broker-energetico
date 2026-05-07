# Broker Energetico — Plan #3: Operatività

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRUD contratti + documenti, upload PDF privato su Supabase Storage con URL firmati, dashboard scadenze con widget 60/30/15/0 giorni, sezioni contratti+documenti integrate nella scheda cliente. Al termine: il gestionale è utilizzabile end-to-end per il broker — manca solo l'automazione email/backup (Plan #4).

**Architecture:** Server Components per liste/dettagli (RLS lato DB applica filtri commerciale-owner). Server Actions per mutazioni con validazione Zod. Upload PDF: Server Action riceve `FormData`, valida MIME + size + magic bytes server-side, scrive in bucket privato `documents/{cliente_id}/{contratti|documenti}/{record_id}/{uuid}.pdf`, ritorna path. Download: Server Action `getDownloadUrl` genera URL firmato 60s. Nessuna nuova migrazione DB (schema completo da Plan #1). Mantenuto pattern shadcn v4 + @base-ui/react + react-hook-form + zod.

**Tech Stack:** Next.js 16 · @supabase/ssr · @supabase/supabase-js (storage) · react-hook-form · zod · @tanstack/react-table · vitest

**Spec di riferimento:** `docs/superpowers/specs/2026-05-06-broker-energetico-design.md` §5, §7, §10
**Plan precedenti:** `2026-05-06-broker-foundation-auth.md` (mergiato), `2026-05-06-broker-anagrafiche.md` (mergiato)

---

## File Structure

```
broker-energetico/
├── src/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── ScadenzaBadge.tsx       NEW · pill colorata 60/30/15/0
│   │   │   └── PdfDownloadButton.tsx   NEW · genera URL firmato e apre
│   │   ├── contratti/
│   │   │   ├── ContrattoForm.tsx       NEW · campi condizionali POD/PDR
│   │   │   ├── ContrattiTable.tsx      NEW · TanStack
│   │   │   ├── ContrattiFilters.tsx    NEW · stato/fornitore/scadenza/cliente
│   │   │   ├── ContrattoStatoBadge.tsx NEW
│   │   │   ├── ContrattoDeleteButton.tsx NEW · admin only, alert-dialog
│   │   │   └── RinnovaContrattoButton.tsx NEW · crea nuovo + replaced_by_id
│   │   ├── documenti/
│   │   │   ├── DocumentoForm.tsx       NEW · upload PDF + scadenza condizionale
│   │   │   ├── DocumentiTable.tsx      NEW
│   │   │   ├── DocumentoDeleteButton.tsx NEW
│   │   │   └── UploadPdf.tsx           NEW · drag&drop wrapper
│   │   ├── clienti/
│   │   │   ├── ClienteContrattiSection.tsx NEW · tab nella scheda cliente
│   │   │   └── ClienteDocumentiSection.tsx NEW
│   │   └── dashboard/
│   │       └── ScadenzeWidget.tsx      NEW · raggruppato per soglia
│   ├── app/(app)/
│   │   ├── dashboard/page.tsx          MODIFY · sostituisce placeholder con ScadenzeWidget
│   │   ├── contratti/
│   │   │   ├── page.tsx                NEW · lista globale + filtri
│   │   │   ├── nuovo/page.tsx          NEW · ?cliente= preselezione
│   │   │   ├── [id]/page.tsx           NEW · dettaglio + storico rinnovi
│   │   │   └── [id]/modifica/page.tsx  NEW
│   │   ├── documenti/
│   │   │   ├── page.tsx                NEW · lista globale + filtri
│   │   │   └── [id]/modifica/page.tsx  NEW
│   │   └── clienti/[id]/page.tsx       MODIFY · aggiungi sezioni contratti+documenti
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── validate.ts             NEW · MIME + size + magic bytes
│   │   │   └── validate.test.ts        NEW
│   │   ├── storage/
│   │   │   └── pdf.ts                  NEW · uploadPdf, getDownloadUrl, deletePdf
│   │   ├── contratti/
│   │   │   ├── actions.ts              NEW · CRUD + rinnova
│   │   │   └── queries.ts              NEW · listContratti con filtri, dettaglio, scadenze
│   │   ├── documenti/
│   │   │   ├── actions.ts              NEW · CRUD con upload
│   │   │   └── queries.ts              NEW · listDocumenti con filtri, dettaglio
│   │   ├── scadenze/
│   │   │   └── helpers.ts              NEW · pure: giorniAllaScadenza, sogliaPerGiorni, classificaScadenza
│   │   └── validation/
│   │       ├── contratto-schema.ts     NEW
│   │       └── documento-schema.ts     NEW
│   └── components/
│       └── ui/                         NO CHANGES (shadcn components da Plan #1-2 sufficienti)
├── tests/
│   └── unit/
│       ├── contratto-schema.test.ts    NEW
│       ├── documento-schema.test.ts    NEW
│       ├── pdf-validate.test.ts        NEW
│       └── scadenze-helpers.test.ts    NEW
└── package.json                        MAYBE: aggiungere file-type per magic bytes (alternativa: detection manuale)
```

---

## Conventions

- **No nuove migrazioni DB.** Schema completo da Plan #1.
- **RLS già attiva** su contratti/documenti/storage. Server Actions usano client server (`createClient`), RLS filtra automaticamente. Service client NON usato in questo plan.
- **Validazione PDF**: magic bytes manuale (primi 4 byte = `%PDF`), MIME = `application/pdf`, size ≤ `MAX_UPLOAD_MB` (default 10).
- **Upload pattern**: Server Action riceve `FormData`, estrae file, valida, carica su Storage, INSERT/UPDATE record DB. Niente upload diretto dal browser al bucket (per RLS sicura + validazione server-side).
- **Download pattern**: Server Action genera signed URL (60s) → ritorna URL → browser fa fetch/redirect.

---

## Task 1: Helpers scadenze + test

**Files:**
- Create: `src/lib/scadenze/helpers.ts`, `tests/unit/scadenze-helpers.test.ts`

- [ ] **Step 1.1: Helpers**

```ts
// src/lib/scadenze/helpers.ts
export type Soglia = 0 | 15 | 30 | 60;
export type ClasseScadenza = "scaduto" | "critica" | "imminente" | "vicina" | "futura";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Giorni dalla data odierna alla data di scadenza (negativi = scaduto). */
export function giorniAllaScadenza(dataScadenza: string | Date, today: Date = new Date()): number {
  const target = typeof dataScadenza === "string" ? new Date(dataScadenza) : dataScadenza;
  // Normalizza a midnight UTC per evitare drift orario
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((b - a) / MS_PER_DAY);
}

/** Classifica la scadenza in 5 livelli per UI. */
export function classificaScadenza(giorni: number): ClasseScadenza {
  if (giorni < 0) return "scaduto";
  if (giorni <= 15) return "critica";
  if (giorni <= 30) return "imminente";
  if (giorni <= 60) return "vicina";
  return "futura";
}

/** Per cron digest: ritorna 0/15/30/60 SOLO se giorni == soglia esatta. Altrimenti null. */
export function sogliaEsatta(giorni: number): Soglia | null {
  if (giorni === 0) return 0;
  if (giorni === 15) return 15;
  if (giorni === 30) return 30;
  if (giorni === 60) return 60;
  return null;
}
```

- [ ] **Step 1.2: Test**

```ts
// tests/unit/scadenze-helpers.test.ts
import { describe, it, expect } from "vitest";
import { giorniAllaScadenza, classificaScadenza, sogliaEsatta } from "@/lib/scadenze/helpers";

describe("giorniAllaScadenza", () => {
  it("0 if same day", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-05-07", today)).toBe(0);
  });
  it("positive if future", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-06-06", today)).toBe(30);
  });
  it("negative if past", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-05-01", today)).toBe(-6);
  });
});

describe("classificaScadenza", () => {
  it("scaduto for negative", () => expect(classificaScadenza(-1)).toBe("scaduto"));
  it("critica for 0-15", () => {
    expect(classificaScadenza(0)).toBe("critica");
    expect(classificaScadenza(15)).toBe("critica");
  });
  it("imminente for 16-30", () => {
    expect(classificaScadenza(16)).toBe("imminente");
    expect(classificaScadenza(30)).toBe("imminente");
  });
  it("vicina for 31-60", () => {
    expect(classificaScadenza(31)).toBe("vicina");
    expect(classificaScadenza(60)).toBe("vicina");
  });
  it("futura for >60", () => expect(classificaScadenza(61)).toBe("futura"));
});

describe("sogliaEsatta", () => {
  it("matches exact thresholds", () => {
    expect(sogliaEsatta(0)).toBe(0);
    expect(sogliaEsatta(15)).toBe(15);
    expect(sogliaEsatta(30)).toBe(30);
    expect(sogliaEsatta(60)).toBe(60);
  });
  it("null otherwise", () => {
    expect(sogliaEsatta(1)).toBeNull();
    expect(sogliaEsatta(45)).toBeNull();
    expect(sogliaEsatta(-1)).toBeNull();
  });
});
```

- [ ] **Step 1.3: Run + commit**

```bash
pnpm test:unit
git add src/lib/scadenze/ tests/unit/scadenze-helpers.test.ts
git commit -m "feat(scadenze): pure helpers giorni/classifica/soglia + tests"
```

---

## Task 2: Validation PDF + test

**Files:**
- Create: `src/lib/pdf/validate.ts`, `tests/unit/pdf-validate.test.ts`

- [ ] **Step 2.1: Validate function**

```ts
// src/lib/pdf/validate.ts
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
const ACCEPTED_MIME = "application/pdf";

export type ValidatePdfResult =
  | { ok: true }
  | { ok: false; error: string };

export async function validatePdf(file: File, maxMb = Number(process.env.MAX_UPLOAD_MB ?? 10)): Promise<ValidatePdfResult> {
  if (!file) return { ok: false, error: "Nessun file caricato" };
  if (file.type !== ACCEPTED_MIME) {
    return { ok: false, error: `Tipo file non valido (${file.type || "sconosciuto"}). Solo PDF accettati.` };
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `File troppo grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Massimo ${maxMb} MB.` };
  }
  if (file.size < PDF_MAGIC.length) {
    return { ok: false, error: "File vuoto o corrotto" };
  }
  const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());
  for (let i = 0; i < PDF_MAGIC.length; i++) {
    if (head[i] !== PDF_MAGIC[i]) {
      return { ok: false, error: "Il file non è un PDF valido (magic bytes mancanti)" };
    }
  }
  return { ok: true };
}
```

- [ ] **Step 2.2: Test**

```ts
// tests/unit/pdf-validate.test.ts
import { describe, it, expect } from "vitest";
import { validatePdf } from "@/lib/pdf/validate";

function makeFile(bytes: number[], { name = "x.pdf", type = "application/pdf" } = {}): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]; // %PDF-1.7

describe("validatePdf", () => {
  it("accepts valid pdf", async () => {
    const r = await validatePdf(makeFile(PDF_HEAD));
    expect(r.ok).toBe(true);
  });
  it("rejects wrong mime", async () => {
    const r = await validatePdf(makeFile(PDF_HEAD, { type: "image/png" }));
    expect(r.ok).toBe(false);
  });
  it("rejects oversize", async () => {
    const big = makeFile(PDF_HEAD.concat(new Array(11 * 1024 * 1024).fill(0)));
    const r = await validatePdf(big, 10);
    expect(r.ok).toBe(false);
  });
  it("rejects bad magic bytes", async () => {
    const r = await validatePdf(makeFile([0x00, 0x01, 0x02, 0x03]));
    expect(r.ok).toBe(false);
  });
  it("rejects empty file", async () => {
    const r = await validatePdf(makeFile([]));
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2.3: Run + commit**

```bash
pnpm test:unit
git add src/lib/pdf/ tests/unit/pdf-validate.test.ts
git commit -m "feat(pdf): validate mime + size + magic bytes"
```

---

## Task 3: Storage helpers PDF

**Files:**
- Create: `src/lib/storage/pdf.ts`

- [ ] **Step 3.1: Helpers**

```ts
// src/lib/storage/pdf.ts
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "documents";

export type Kind = "contratti" | "documenti";

/** Carica file in {cliente_id}/{kind}/{record_id}/{uuid}.pdf. Ritorna path. */
export async function uploadPdf(file: File, opts: { clienteId: string; kind: Kind; recordId: string }): Promise<string> {
  const supabase = await createClient();
  const path = `${opts.clienteId}/${opts.kind}/${opts.recordId}/${randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw new Error(`Upload fallito: ${error.message}`);
  return path;
}

/** Genera signed URL valido 60s. */
export async function getDownloadUrl(path: string, ttlSeconds = 60): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data) throw new Error(`Signed URL fallito: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}

/** Rimuove file dal bucket. Best-effort: non solleva se il file non c'è. */
export async function deletePdf(path: string): Promise<void> {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}
```

- [ ] **Step 3.2: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/storage/
git commit -m "feat(storage): pdf upload/download/delete helpers"
```

---

## Task 4: Schema Zod contratto + documento

**Files:**
- Create: `src/lib/validation/contratto-schema.ts`, `src/lib/validation/documento-schema.ts`, `tests/unit/contratto-schema.test.ts`, `tests/unit/documento-schema.test.ts`

- [ ] **Step 4.1: contratto-schema.ts**

```ts
// src/lib/validation/contratto-schema.ts
import { z } from "zod";

export const CATEGORIA = ["energia", "rinnovabili", "riscaldamento", "utility", "servizi"] as const;
export const TIPO_CONTRATTO = [
  "luce", "gas", "dual_fuel", "fotovoltaico", "accumulo", "comunita_energetica", "ricarica_ev",
  "teleriscaldamento", "gpl", "pellet", "idrico", "internet_fibra", "telefonia",
  "efficienza_energetica", "diagnosi_energetica", "manutenzione", "assicurativo",
] as const;
export const STATO = ["bozza", "attivo", "scaduto", "rinnovato", "annullato"] as const;
export const MERCATO = ["libero", "tutelato"] as const;

/** Mapping categoria → tipi consentiti per UI condizionale */
export const TIPI_PER_CATEGORIA: Record<typeof CATEGORIA[number], readonly typeof TIPO_CONTRATTO[number][]> = {
  energia: ["luce", "gas", "dual_fuel"],
  rinnovabili: ["fotovoltaico", "accumulo", "comunita_energetica", "ricarica_ev"],
  riscaldamento: ["teleriscaldamento", "gpl", "pellet"],
  utility: ["idrico", "internet_fibra", "telefonia"],
  servizi: ["efficienza_energetica", "diagnosi_energetica", "manutenzione", "assicurativo"],
};

export const contrattoSchema = z.object({
  cliente_id: z.string().uuid(),
  fornitore_id: z.string().uuid(),
  categoria: z.enum(CATEGORIA),
  tipo: z.enum(TIPO_CONTRATTO),
  mercato: z.enum(MERCATO).optional().nullable(),
  pod: z.string().trim().max(40).optional().or(z.literal("")),
  pdr: z.string().trim().max(40).optional().or(z.literal("")),
  data_inizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  data_scadenza: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  stato: z.enum(STATO).default("bozza"),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
}).refine(
  (d) => new Date(d.data_scadenza) >= new Date(d.data_inizio),
  { message: "La scadenza deve essere successiva alla data di inizio", path: ["data_scadenza"] },
).refine(
  (d) => TIPI_PER_CATEGORIA[d.categoria].includes(d.tipo),
  { message: "Tipo non compatibile con la categoria scelta", path: ["tipo"] },
);

export type ContrattoInput = z.infer<typeof contrattoSchema>;
```

- [ ] **Step 4.2: documento-schema.ts**

```ts
// src/lib/validation/documento-schema.ts
import { z } from "zod";

export const TIPO_DOCUMENTO = [
  "carta_identita", "passaporto", "patente", "permesso_soggiorno",
  "codice_fiscale", "tessera_sanitaria", "partita_iva",
  "visura_camerale", "certificato_attribuzione_piva",
  "bolletta_recente", "delega_voltura", "mandato_consulenza",
  "privacy_gdpr", "iban", "rid_sepa", "altro",
] as const;

/** Tipi per cui la data di scadenza è obbligatoria nel form (UX). Lato DB resta opzionale. */
export const TIPI_SCADENZA_RICHIESTA: readonly typeof TIPO_DOCUMENTO[number][] = [
  "carta_identita", "passaporto", "patente", "permesso_soggiorno", "visura_camerale",
];

export const documentoSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum(TIPO_DOCUMENTO),
  descrizione: z.string().trim().max(200).optional().or(z.literal("")),
  data_scadenza: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).nullable(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
}).refine(
  (d) => d.tipo !== "altro" || (d.descrizione && d.descrizione.trim().length >= 2),
  { message: "Descrizione obbligatoria per tipo 'altro'", path: ["descrizione"] },
).refine(
  (d) => !TIPI_SCADENZA_RICHIESTA.includes(d.tipo) || (typeof d.data_scadenza === "string" && d.data_scadenza.length > 0),
  { message: "Data scadenza obbligatoria per questo tipo di documento", path: ["data_scadenza"] },
);

export type DocumentoInput = z.infer<typeof documentoSchema>;
```

- [ ] **Step 4.3: Test contratto**

```ts
// tests/unit/contratto-schema.test.ts
import { describe, it, expect } from "vitest";
import { contrattoSchema } from "@/lib/validation/contratto-schema";

const base = {
  cliente_id: "00000000-0000-0000-0000-000000000001",
  fornitore_id: "00000000-0000-0000-0000-000000000002",
  categoria: "energia" as const,
  tipo: "luce" as const,
  data_inizio: "2026-01-01",
  data_scadenza: "2027-01-01",
  stato: "attivo" as const,
};

describe("contrattoSchema", () => {
  it("accepts a valid energia/luce contratto", () => {
    expect(contrattoSchema.safeParse(base).success).toBe(true);
  });
  it("rejects scadenza before inizio", () => {
    const r = contrattoSchema.safeParse({ ...base, data_inizio: "2026-12-01", data_scadenza: "2026-01-01" });
    expect(r.success).toBe(false);
  });
  it("rejects tipo incompatible with categoria", () => {
    const r = contrattoSchema.safeParse({ ...base, categoria: "rinnovabili", tipo: "luce" });
    expect(r.success).toBe(false);
  });
  it("accepts categoria/tipo coherent", () => {
    const r = contrattoSchema.safeParse({ ...base, categoria: "rinnovabili", tipo: "fotovoltaico" });
    expect(r.success).toBe(true);
  });
  it("rejects bad date format", () => {
    const r = contrattoSchema.safeParse({ ...base, data_inizio: "2026/01/01" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 4.4: Test documento**

```ts
// tests/unit/documento-schema.test.ts
import { describe, it, expect } from "vitest";
import { documentoSchema } from "@/lib/validation/documento-schema";

const cliente_id = "00000000-0000-0000-0000-000000000001";

describe("documentoSchema", () => {
  it("requires data_scadenza for carta_identita", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "carta_identita" });
    expect(r.success).toBe(false);
  });
  it("accepts carta_identita with data_scadenza", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "carta_identita", data_scadenza: "2030-01-01" });
    expect(r.success).toBe(true);
  });
  it("requires descrizione for tipo altro", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "altro" });
    expect(r.success).toBe(false);
  });
  it("accepts altro with descrizione", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "altro", descrizione: "Contratto extra" });
    expect(r.success).toBe(true);
  });
  it("accepts iban without scadenza", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "iban" });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 4.5: Run + commit**

```bash
pnpm test:unit
git add src/lib/validation/contratto-schema.ts src/lib/validation/documento-schema.ts tests/unit/contratto-schema.test.ts tests/unit/documento-schema.test.ts
git commit -m "feat(validation): contratto and documento zod schemas with conditional rules"
```

---

## Task 5: Server Actions contratti + queries

**Files:**
- Create: `src/lib/contratti/actions.ts`, `src/lib/contratti/queries.ts`

- [ ] **Step 5.1: queries.ts**

```ts
// src/lib/contratti/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Contratto } from "@/lib/supabase/types";

export type ContrattiFilter = {
  q?: string;
  cliente_id?: string;
  fornitore_id?: string;
  stato?: "bozza" | "attivo" | "scaduto" | "rinnovato" | "annullato";
  in_scadenza_entro?: 60 | 30 | 15 | 0;
};

export async function listContratti(filter: ContrattiFilter = {}): Promise<Contratto[]> {
  const supabase = await createClient();
  let q = supabase.from("contratti").select("*").order("data_scadenza", { ascending: true });

  if (filter.cliente_id) q = q.eq("cliente_id", filter.cliente_id);
  if (filter.fornitore_id) q = q.eq("fornitore_id", filter.fornitore_id);
  if (filter.stato) q = q.eq("stato", filter.stato);
  if (filter.in_scadenza_entro != null) {
    const today = new Date();
    const limit = new Date(today.getTime() + filter.in_scadenza_entro * 24 * 60 * 60 * 1000);
    q = q.gte("data_scadenza", today.toISOString().slice(0, 10));
    q = q.lte("data_scadenza", limit.toISOString().slice(0, 10));
    q = q.eq("stato", "attivo");
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getContratto(id: string): Promise<Contratto | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("contratti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getStoricoRinnovi(id: string): Promise<Contratto[]> {
  const supabase = await createClient();
  // Trova catena: contratti che puntano a questo (sostituiti) + contratti puntati da questo
  const { data: predecessori } = await supabase.from("contratti").select("*").eq("replaced_by_id", id);
  return predecessori ?? [];
}
```

- [ ] **Step 5.2: actions.ts**

```ts
// src/lib/contratti/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { contrattoSchema, type ContrattoInput } from "@/lib/validation/contratto-schema";
import { validatePdf } from "@/lib/pdf/validate";
import { uploadPdf, deletePdf } from "@/lib/storage/pdf";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof ContrattoInput, string>> };

function fieldErrors(parsed: ReturnType<typeof contrattoSchema.safeParse>) {
  if (parsed.success) return undefined;
  const out: Partial<Record<keyof ContrattoInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const k = issue.path[0] as keyof ContrattoInput | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createContratto(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requireProfile();
  const raw = Object.fromEntries(formData.entries()) as unknown as ContrattoInput & { allegato?: File };
  const file = formData.get("allegato") as File | null;

  const parsed = contrattoSchema.safeParse({
    ...raw,
    pod: raw.pod || "",
    pdr: raw.pdr || "",
    note: raw.note || "",
    mercato: (raw as { mercato?: string }).mercato || null,
  });
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };
  const data = parsed.data;

  let pdfPath: string | null = null;
  if (file && file.size > 0) {
    const valid = await validatePdf(file);
    if (!valid.ok) return { ok: false, error: valid.error };
  }

  const supabase = await createClient();
  const { data: ins, error } = await supabase
    .from("contratti")
    .insert({
      cliente_id: data.cliente_id,
      fornitore_id: data.fornitore_id,
      categoria: data.categoria,
      tipo: data.tipo,
      mercato: data.mercato || null,
      pod: data.pod || null,
      pdr: data.pdr || null,
      data_inizio: data.data_inizio,
      data_scadenza: data.data_scadenza,
      stato: data.stato,
      note: data.note || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !ins) return { ok: false, error: error?.message ?? "Errore inserimento" };

  if (file && file.size > 0) {
    try {
      pdfPath = await uploadPdf(file, { clienteId: data.cliente_id, kind: "contratti", recordId: ins.id });
      await supabase.from("contratti").update({ allegato_path: pdfPath }).eq("id", ins.id);
    } catch (err) {
      // rollback: cancella record se upload fallisce
      await supabase.from("contratti").delete().eq("id", ins.id);
      return { ok: false, error: err instanceof Error ? err.message : "Upload fallito" };
    }
  }

  revalidatePath("/contratti");
  revalidatePath(`/clienti/${data.cliente_id}`);
  return { ok: true, data: { id: ins.id } };
}

export async function updateContratto(id: string, formData: FormData): Promise<ActionResult> {
  await requireProfile();
  const raw = Object.fromEntries(formData.entries()) as unknown as ContrattoInput;
  const file = formData.get("allegato") as File | null;
  const removeAllegato = formData.get("remove_allegato") === "1";

  const parsed = contrattoSchema.safeParse({
    ...raw,
    pod: raw.pod || "",
    pdr: raw.pdr || "",
    note: raw.note || "",
    mercato: (raw as { mercato?: string }).mercato || null,
  });
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };
  const data = parsed.data;

  if (file && file.size > 0) {
    const valid = await validatePdf(file);
    if (!valid.ok) return { ok: false, error: valid.error };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("contratti").select("allegato_path").eq("id", id).maybeSingle();

  let pdfPath = existing?.allegato_path ?? null;

  if (file && file.size > 0) {
    pdfPath = await uploadPdf(file, { clienteId: data.cliente_id, kind: "contratti", recordId: id });
    if (existing?.allegato_path) await deletePdf(existing.allegato_path);
  } else if (removeAllegato && existing?.allegato_path) {
    await deletePdf(existing.allegato_path);
    pdfPath = null;
  }

  const { error } = await supabase.from("contratti").update({
    cliente_id: data.cliente_id,
    fornitore_id: data.fornitore_id,
    categoria: data.categoria,
    tipo: data.tipo,
    mercato: data.mercato || null,
    pod: data.pod || null,
    pdr: data.pdr || null,
    data_inizio: data.data_inizio,
    data_scadenza: data.data_scadenza,
    stato: data.stato,
    note: data.note || null,
    allegato_path: pdfPath,
  }).eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratti");
  revalidatePath(`/contratti/${id}`);
  revalidatePath(`/clienti/${data.cliente_id}`);
  return { ok: true };
}

export async function deleteContratto(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("contratti").select("allegato_path, cliente_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("contratti").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (existing?.allegato_path) await deletePdf(existing.allegato_path);
  revalidatePath("/contratti");
  if (existing?.cliente_id) revalidatePath(`/clienti/${existing.cliente_id}`);
  redirect("/contratti");
}

export async function rinnovaContratto(id: string, nuoveDate: { data_inizio: string; data_scadenza: string }): Promise<ActionResult<{ newId: string }>> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: vecchio } = await supabase.from("contratti").select("*").eq("id", id).maybeSingle();
  if (!vecchio) return { ok: false, error: "Contratto non trovato" };

  const { data: nuovo, error: errIns } = await supabase
    .from("contratti")
    .insert({
      cliente_id: vecchio.cliente_id,
      fornitore_id: vecchio.fornitore_id,
      categoria: vecchio.categoria,
      tipo: vecchio.tipo,
      mercato: vecchio.mercato,
      pod: vecchio.pod,
      pdr: vecchio.pdr,
      data_inizio: nuoveDate.data_inizio,
      data_scadenza: nuoveDate.data_scadenza,
      stato: "attivo",
      note: `Rinnovo di contratto ${id}`,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (errIns || !nuovo) return { ok: false, error: errIns?.message ?? "Errore creazione rinnovo" };

  await supabase.from("contratti").update({ stato: "rinnovato", replaced_by_id: nuovo.id }).eq("id", id);

  revalidatePath("/contratti");
  revalidatePath(`/clienti/${vecchio.cliente_id}`);
  return { ok: true, data: { newId: nuovo.id } };
}
```

- [ ] **Step 5.3: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/contratti/
git commit -m "feat(contratti): server actions and queries with pdf upload + rinnovo flow"
```

---

## Task 6: Server Actions documenti + queries

**Files:**
- Create: `src/lib/documenti/actions.ts`, `src/lib/documenti/queries.ts`

- [ ] **Step 6.1: queries.ts**

```ts
// src/lib/documenti/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Documento } from "@/lib/supabase/types";

export type DocumentiFilter = {
  cliente_id?: string;
  tipo?: string;
  in_scadenza_entro?: 60 | 30 | 15 | 0;
};

export async function listDocumenti(filter: DocumentiFilter = {}): Promise<Documento[]> {
  const supabase = await createClient();
  let q = supabase.from("documenti").select("*").order("created_at", { ascending: false });
  if (filter.cliente_id) q = q.eq("cliente_id", filter.cliente_id);
  if (filter.tipo) q = q.eq("tipo", filter.tipo);
  if (filter.in_scadenza_entro != null) {
    const today = new Date();
    const limit = new Date(today.getTime() + filter.in_scadenza_entro * 24 * 60 * 60 * 1000);
    q = q.not("data_scadenza", "is", null);
    q = q.gte("data_scadenza", today.toISOString().slice(0, 10));
    q = q.lte("data_scadenza", limit.toISOString().slice(0, 10));
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getDocumento(id: string): Promise<Documento | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("documenti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
```

- [ ] **Step 6.2: actions.ts**

```ts
// src/lib/documenti/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { documentoSchema, type DocumentoInput } from "@/lib/validation/documento-schema";
import { validatePdf } from "@/lib/pdf/validate";
import { uploadPdf, deletePdf, getDownloadUrl } from "@/lib/storage/pdf";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof DocumentoInput, string>> };

function fieldErrors(parsed: ReturnType<typeof documentoSchema.safeParse>) {
  if (parsed.success) return undefined;
  const out: Partial<Record<keyof DocumentoInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const k = issue.path[0] as keyof DocumentoInput | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createDocumento(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requireProfile();
  const raw = Object.fromEntries(formData.entries()) as unknown as DocumentoInput;
  const file = formData.get("file") as File | null;

  const parsed = documentoSchema.safeParse({
    ...raw,
    descrizione: raw.descrizione || "",
    note: raw.note || "",
    data_scadenza: raw.data_scadenza || null,
  });
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };
  const data = parsed.data;

  if (!file || file.size === 0) return { ok: false, error: "File PDF obbligatorio" };
  const valid = await validatePdf(file);
  if (!valid.ok) return { ok: false, error: valid.error };

  const supabase = await createClient();
  const { data: ins, error } = await supabase.from("documenti").insert({
    cliente_id: data.cliente_id,
    tipo: data.tipo,
    descrizione: data.descrizione || null,
    file_path: "pending", // overridden after upload
    data_scadenza: data.data_scadenza || null,
    note: data.note || null,
    created_by: profile.id,
  }).select("id").single();

  if (error || !ins) return { ok: false, error: error?.message ?? "Errore inserimento" };

  try {
    const path = await uploadPdf(file, { clienteId: data.cliente_id, kind: "documenti", recordId: ins.id });
    await supabase.from("documenti").update({ file_path: path }).eq("id", ins.id);
  } catch (err) {
    await supabase.from("documenti").delete().eq("id", ins.id);
    return { ok: false, error: err instanceof Error ? err.message : "Upload fallito" };
  }

  revalidatePath("/documenti");
  revalidatePath(`/clienti/${data.cliente_id}`);
  return { ok: true, data: { id: ins.id } };
}

export async function updateDocumento(id: string, formData: FormData): Promise<ActionResult> {
  await requireProfile();
  const raw = Object.fromEntries(formData.entries()) as unknown as DocumentoInput;
  const file = formData.get("file") as File | null;

  const parsed = documentoSchema.safeParse({
    ...raw,
    descrizione: raw.descrizione || "",
    note: raw.note || "",
    data_scadenza: raw.data_scadenza || null,
  });
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("documenti").select("file_path").eq("id", id).maybeSingle();

  let filePath = existing?.file_path ?? "pending";
  if (file && file.size > 0) {
    const valid = await validatePdf(file);
    if (!valid.ok) return { ok: false, error: valid.error };
    filePath = await uploadPdf(file, { clienteId: data.cliente_id, kind: "documenti", recordId: id });
    if (existing?.file_path && existing.file_path !== "pending") await deletePdf(existing.file_path);
  }

  const { error } = await supabase.from("documenti").update({
    cliente_id: data.cliente_id,
    tipo: data.tipo,
    descrizione: data.descrizione || null,
    file_path: filePath,
    data_scadenza: data.data_scadenza || null,
    note: data.note || null,
  }).eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/documenti");
  revalidatePath(`/documenti/${id}/modifica`);
  revalidatePath(`/clienti/${data.cliente_id}`);
  return { ok: true };
}

export async function deleteDocumento(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("documenti").select("file_path, cliente_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("documenti").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (existing?.file_path && existing.file_path !== "pending") await deletePdf(existing.file_path);
  revalidatePath("/documenti");
  if (existing?.cliente_id) revalidatePath(`/clienti/${existing.cliente_id}`);
  redirect("/documenti");
}

export async function getDocumentoUrl(id: string): Promise<{ url: string } | { error: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("documenti").select("file_path").eq("id", id).maybeSingle();
  if (!data?.file_path) return { error: "File non trovato" };
  try {
    const url = await getDownloadUrl(data.file_path);
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Errore signed URL" };
  }
}

export async function getContrattoAllegatoUrl(id: string): Promise<{ url: string } | { error: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("contratti").select("allegato_path").eq("id", id).maybeSingle();
  if (!data?.allegato_path) return { error: "Allegato non trovato" };
  try {
    const url = await getDownloadUrl(data.allegato_path);
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Errore signed URL" };
  }
}
```

- [ ] **Step 6.3: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/documenti/
git commit -m "feat(documenti): server actions and queries with required pdf upload"
```

---

## Task 7: Componenti shared (badge + download)

**Files:**
- Create: `src/components/shared/ScadenzaBadge.tsx`, `src/components/shared/PdfDownloadButton.tsx`

- [ ] **Step 7.1: ScadenzaBadge**

```tsx
// src/components/shared/ScadenzaBadge.tsx
import { Badge } from "@/components/ui/badge";
import { classificaScadenza, giorniAllaScadenza } from "@/lib/scadenze/helpers";

const VARIANT: Record<ReturnType<typeof classificaScadenza>, "default" | "secondary" | "outline" | "destructive"> = {
  scaduto: "outline",
  critica: "destructive",
  imminente: "default",
  vicina: "secondary",
  futura: "secondary",
};

const LABEL: Record<ReturnType<typeof classificaScadenza>, string> = {
  scaduto: "Scaduto",
  critica: "Critica",
  imminente: "30 gg",
  vicina: "60 gg",
  futura: "OK",
};

export function ScadenzaBadge({ data, withGiorni = true }: { data: string | null; withGiorni?: boolean }) {
  if (!data) return <span className="text-muted-foreground">—</span>;
  const giorni = giorniAllaScadenza(data);
  const cls = classificaScadenza(giorni);
  const label = withGiorni
    ? giorni < 0 ? `Scaduto da ${-giorni}gg` : `${giorni}gg`
    : LABEL[cls];
  return <Badge variant={VARIANT[cls]}>{label}</Badge>;
}
```

- [ ] **Step 7.2: PdfDownloadButton**

```tsx
// src/components/shared/PdfDownloadButton.tsx
"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Fetcher = () => Promise<{ url: string } | { error: string }>;

export function PdfDownloadButton({ getUrl, label = "Scarica PDF" }: { getUrl: Fetcher; label?: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      const r = await getUrl();
      if ("url" in r) window.open(r.url, "_blank");
      else toast.error(r.error);
    });
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <Download className="mr-2 h-4 w-4" /> {pending ? "Apertura..." : label}
    </Button>
  );
}
```

- [ ] **Step 7.3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/shared/ScadenzaBadge.tsx src/components/shared/PdfDownloadButton.tsx
git commit -m "feat(shared): scadenza-badge and pdf-download-button"
```

---

## Task 8: ContrattoForm component

**Files:**
- Create: `src/components/contratti/ContrattoForm.tsx`, `src/components/contratti/ContrattoStatoBadge.tsx`

- [ ] **Step 8.1: ContrattoStatoBadge**

```tsx
// src/components/contratti/ContrattoStatoBadge.tsx
import { Badge } from "@/components/ui/badge";
import type { StatoContratto } from "@/lib/supabase/types";

const VARIANT: Record<StatoContratto, "default" | "secondary" | "outline" | "destructive"> = {
  bozza: "outline",
  attivo: "default",
  scaduto: "destructive",
  rinnovato: "secondary",
  annullato: "outline",
};

const LABEL: Record<StatoContratto, string> = {
  bozza: "Bozza",
  attivo: "Attivo",
  scaduto: "Scaduto",
  rinnovato: "Rinnovato",
  annullato: "Annullato",
};

export function ContrattoStatoBadge({ stato }: { stato: StatoContratto }) {
  return <Badge variant={VARIANT[stato]} className="capitalize">{LABEL[stato]}</Badge>;
}
```

- [ ] **Step 8.2: ContrattoForm**

```tsx
// src/components/contratti/ContrattoForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  contrattoSchema, CATEGORIA, TIPI_PER_CATEGORIA, STATO, MERCATO,
  type ContrattoInput,
} from "@/lib/validation/contratto-schema";
import { createContratto, updateContratto } from "@/lib/contratti/actions";
import type { Contratto, Cliente, Fornitore } from "@/lib/supabase/types";

type Props = {
  contratto?: Contratto;
  clienti: Pick<Cliente, "id" | "nome">[];
  fornitori: Pick<Fornitore, "id" | "nome">[];
  defaultClienteId?: string;
};

export function ContrattoForm({ contratto, clienti, fornitori, defaultClienteId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContrattoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contrattoSchema) as any,
    defaultValues: {
      cliente_id: contratto?.cliente_id ?? defaultClienteId ?? "",
      fornitore_id: contratto?.fornitore_id ?? "",
      categoria: contratto?.categoria ?? "energia",
      tipo: contratto?.tipo ?? "luce",
      mercato: contratto?.mercato ?? null,
      pod: contratto?.pod ?? "",
      pdr: contratto?.pdr ?? "",
      data_inizio: contratto?.data_inizio ?? "",
      data_scadenza: contratto?.data_scadenza ?? "",
      stato: contratto?.stato ?? "bozza",
      note: contratto?.note ?? "",
    },
  });

  const categoria = form.watch("categoria");
  const tipo = form.watch("tipo");
  const tipiAmmessi = TIPI_PER_CATEGORIA[categoria];
  const showPod = tipo === "luce" || tipo === "dual_fuel";
  const showPdr = tipo === "gas" || tipo === "dual_fuel";

  async function onSubmit(values: ContrattoInput) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
      const fileInput = (document.getElementById("allegato") as HTMLInputElement | null);
      if (fileInput?.files?.[0]) fd.append("allegato", fileInput.files[0]);

      const res = contratto ? await updateContratto(contratto.id, fd) : await createContratto(fd);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof ContrattoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(contratto ? "Contratto aggiornato" : "Contratto creato");
      const id = contratto ? contratto.id : (res as { ok: true; data?: { id: string } }).data?.id;
      router.push(id ? `/contratti/${id}` : "/contratti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <select id="cliente_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("cliente_id")}>
                <option value="">— seleziona —</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {form.formState.errors.cliente_id && (
                <p className="text-sm text-destructive">{form.formState.errors.cliente_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornitore_id">Fornitore *</Label>
              <select id="fornitore_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("fornitore_id")}>
                <option value="">— seleziona —</option>
                {fornitori.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {form.formState.errors.fornitore_id && (
                <p className="text-sm text-destructive">{form.formState.errors.fornitore_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select id="categoria" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("categoria")}>
                {CATEGORIA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select id="tipo" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("tipo")}>
                {tipiAmmessi.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.formState.errors.tipo && (
                <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mercato">Mercato</Label>
              <select id="mercato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("mercato")}>
                <option value="">— non specificato —</option>
                {MERCATO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stato">Stato</Label>
              <select id="stato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("stato")}>
                {STATO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {showPod && (
              <div className="space-y-2">
                <Label htmlFor="pod">POD</Label>
                <Input id="pod" {...form.register("pod")} placeholder="IT001E12345678" />
              </div>
            )}
            {showPdr && (
              <div className="space-y-2">
                <Label htmlFor="pdr">PDR</Label>
                <Input id="pdr" {...form.register("pdr")} placeholder="0123456789012345" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="data_inizio">Data inizio *</Label>
              <Input id="data_inizio" type="date" {...form.register("data_inizio")} />
              {form.formState.errors.data_inizio && (
                <p className="text-sm text-destructive">{form.formState.errors.data_inizio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_scadenza">Data scadenza *</Label>
              <Input id="data_scadenza" type="date" {...form.register("data_scadenza")} />
              {form.formState.errors.data_scadenza && (
                <p className="text-sm text-destructive">{form.formState.errors.data_scadenza.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={3} {...form.register("note")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allegato">Allegato PDF (opzionale)</Label>
            <input id="allegato" name="allegato" type="file" accept="application/pdf" className="block text-sm" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : contratto ? "Salva modifiche" : "Crea contratto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8.3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/contratti/ContrattoForm.tsx src/components/contratti/ContrattoStatoBadge.tsx
git commit -m "feat(contratti): contratto form and stato badge with conditional fields"
```

---

## Task 9: Contratti table + filters + delete + rinnova

**Files:**
- Create: `src/components/contratti/ContrattiTable.tsx`, `src/components/contratti/ContrattiFilters.tsx`, `src/components/contratti/ContrattoDeleteButton.tsx`, `src/components/contratti/RinnovaContrattoButton.tsx`

- [ ] **Step 9.1: ContrattiTable**

```tsx
// src/components/contratti/ContrattiTable.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ContrattoStatoBadge } from "./ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import type { Contratto } from "@/lib/supabase/types";

type Row = Contratto & { cliente_nome?: string | null; fornitore_nome?: string | null };

export function ContrattiTable({ rows }: { rows: Row[] }) {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "cliente_nome",
      header: "Cliente",
      cell: ({ row }) => (
        <Link href={`/clienti/${row.original.cliente_id}`} className="font-medium hover:underline">
          {row.original.cliente_nome ?? "—"}
        </Link>
      ),
    },
    { accessorKey: "fornitore_nome", header: "Fornitore" },
    { accessorKey: "categoria", header: "Categoria" },
    { accessorKey: "tipo", header: "Tipo" },
    {
      accessorKey: "stato",
      header: "Stato",
      cell: ({ row }) => <ContrattoStatoBadge stato={row.original.stato} />,
    },
    {
      accessorKey: "data_scadenza",
      header: "Scadenza",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.original.data_scadenza}</span>
          {row.original.stato === "attivo" && <ScadenzaBadge data={row.original.data_scadenza} />}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/contratti/${row.original.id}`} className="text-sm text-primary hover:underline">
          Dettagli
        </Link>
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
```

- [ ] **Step 9.2: ContrattiFilters**

```tsx
// src/components/contratti/ContrattiFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { STATO } from "@/lib/validation/contratto-schema";
import type { Cliente, Fornitore } from "@/lib/supabase/types";

export function ContrattiFilters({ clienti, fornitori }: { clienti: Pick<Cliente, "id" | "nome">[]; fornitori: Pick<Fornitore, "id" | "nome">[] }) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/contratti?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="stato">Stato</Label>
        <select id="stato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("stato") ?? ""} onChange={(e) => update("stato", e.target.value)}>
          <option value="">Tutti</option>
          {STATO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cliente">Cliente</Label>
        <select id="cliente" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("cliente_id") ?? ""} onChange={(e) => update("cliente_id", e.target.value)}>
          <option value="">Tutti</option>
          {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="fornitore">Fornitore</Label>
        <select id="fornitore" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("fornitore_id") ?? ""} onChange={(e) => update("fornitore_id", e.target.value)}>
          <option value="">Tutti</option>
          {fornitori.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="entro">In scadenza entro</Label>
        <select id="entro" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("entro") ?? ""} onChange={(e) => update("entro", e.target.value)}>
          <option value="">Tutti</option>
          <option value="60">60 giorni</option>
          <option value="30">30 giorni</option>
          <option value="15">15 giorni</option>
          <option value="0">Oggi</option>
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.3: ContrattoDeleteButton**

```tsx
// src/components/contratti/ContrattoDeleteButton.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteContratto } from "@/lib/contratti/actions";
import { toast } from "sonner";

export function ContrattoDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteContratto(id);
      if (!res.ok) toast.error(res.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il contratto?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;operazione è irreversibile. Verrà cancellato anche l&apos;allegato PDF.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? "Elimino..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 9.4: RinnovaContrattoButton**

```tsx
// src/components/contratti/RinnovaContrattoButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { rinnovaContratto } from "@/lib/contratti/actions";
import { toast } from "sonner";

export function RinnovaContrattoButton({ id, defaultStart, defaultEnd }: { id: string; defaultStart: string; defaultEnd: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [pending, startTr] = useTransition();

  function onConfirm() {
    startTr(async () => {
      const res = await rinnovaContratto(id, { data_inizio: start, data_scadenza: end });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Contratto rinnovato");
      setOpen(false);
      const newId = (res as { ok: true; data?: { newId: string } }).data?.newId;
      if (newId) router.push(`/contratti/${newId}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" /> Rinnova</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rinnova contratto</DialogTitle>
          <DialogDescription>
            Crea un nuovo contratto attivo con stesso cliente/fornitore/tipo. Il contratto corrente verrà marcato come &quot;rinnovato&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="start">Nuova data inizio</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end">Nuova data scadenza</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Rinnovo..." : "Rinnova"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 9.5: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/contratti/ContrattiTable.tsx src/components/contratti/ContrattiFilters.tsx src/components/contratti/ContrattoDeleteButton.tsx src/components/contratti/RinnovaContrattoButton.tsx
git commit -m "feat(contratti): table, filters, delete and rinnova components"
```

---

## Task 10: Pagine contratti

**Files:**
- Create: `src/app/(app)/contratti/page.tsx`, `src/app/(app)/contratti/nuovo/page.tsx`, `src/app/(app)/contratti/[id]/page.tsx`, `src/app/(app)/contratti/[id]/modifica/page.tsx`

- [ ] **Step 10.1: Page lista**

```tsx
// src/app/(app)/contratti/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listContratti, type ContrattiFilter } from "@/lib/contratti/queries";
import { ContrattiTable } from "@/components/contratti/ContrattiTable";
import { ContrattiFilters } from "@/components/contratti/ContrattiFilters";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const entro = sp.entro ? Number(sp.entro) : undefined;
  const filter: ContrattiFilter = {
    cliente_id: sp.cliente_id,
    fornitore_id: sp.fornitore_id,
    stato: sp.stato as ContrattiFilter["stato"],
    in_scadenza_entro: (entro === 0 || entro === 15 || entro === 30 || entro === 60) ? entro : undefined,
  };

  const supabase = await createClient();
  const [contratti, clientiRes, fornitoriRes] = await Promise.all([
    listContratti(filter),
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").order("nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const fornitoriMap = new Map((fornitoriRes.data ?? []).map((f) => [f.id, f.nome]));
  const rows = contratti.map((c) => ({
    ...c,
    cliente_nome: clientiMap.get(c.cliente_id) ?? null,
    fornitore_nome: fornitoriMap.get(c.fornitore_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contratti</h1>
        <Button render={<Link href="/contratti/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo contratto</Link>} />
      </div>
      <ContrattiFilters clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} />
      <ContrattiTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 10.2: Page nuovo**

```tsx
// src/app/(app)/contratti/nuovo/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContrattoForm } from "@/components/contratti/ContrattoForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await requireProfile();
  const { cliente } = await searchParams;

  const supabase = await createClient();
  const [clientiRes, fornitoriRes] = await Promise.all([
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").eq("attivo", true).order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo contratto</h1>
      <ContrattoForm clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} defaultClienteId={cliente} />
    </div>
  );
}
```

- [ ] **Step 10.3: Page dettaglio**

```tsx
// src/app/(app)/contratti/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getContratto, getStoricoRinnovi } from "@/lib/contratti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import { ContrattoDeleteButton } from "@/components/contratti/ContrattoDeleteButton";
import { RinnovaContrattoButton } from "@/components/contratti/RinnovaContrattoButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { getContrattoAllegatoUrl } from "@/lib/documenti/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const c = await getContratto(id);
  if (!c) notFound();

  const supabase = await createClient();
  const [{ data: cliente }, { data: fornitore }, predecessori] = await Promise.all([
    supabase.from("clienti").select("id, nome").eq("id", c.cliente_id).maybeSingle(),
    supabase.from("fornitori").select("id, nome").eq("id", c.fornitore_id).maybeSingle(),
    getStoricoRinnovi(c.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {fornitore?.nome ?? "?"} · <span className="capitalize">{c.tipo}</span>
          </h1>
          <div className="flex items-center gap-2">
            <ContrattoStatoBadge stato={c.stato} />
            {c.stato === "attivo" && <ScadenzaBadge data={c.data_scadenza} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/contratti/${c.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
          {c.stato === "attivo" && (
            <RinnovaContrattoButton id={c.id} defaultStart={c.data_scadenza} defaultEnd={addYear(c.data_scadenza)} />
          )}
          {isAdmin(profile) && <ContrattoDeleteButton id={c.id} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Anagrafica contratto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Cliente" value={cliente ? <Link href={`/clienti/${cliente.id}`} className="hover:underline">{cliente.nome}</Link> : "—"} />
            <Row label="Fornitore" value={fornitore?.nome ?? "—"} />
            <Row label="Categoria" value={c.categoria} />
            <Row label="Tipo" value={c.tipo} />
            <Row label="Mercato" value={c.mercato ?? "—"} />
            {c.pod && <Row label="POD" value={c.pod} />}
            {c.pdr && <Row label="PDR" value={c.pdr} />}
            <Row label="Data inizio" value={c.data_inizio} />
            <Row label="Data scadenza" value={c.data_scadenza} />
            <Row label="Note" value={c.note ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Allegato e storico</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {c.allegato_path
              ? <PdfDownloadButton getUrl={() => getContrattoAllegatoUrl(c.id)} label="Scarica contratto" />
              : <p className="text-muted-foreground">Nessun allegato.</p>}
            {predecessori.length > 0 && (
              <div>
                <p className="font-medium">Contratti precedenti:</p>
                <ul className="list-disc pl-5">
                  {predecessori.map((p) => (
                    <li key={p.id}>
                      <Link href={`/contratti/${p.id}`} className="hover:underline">{p.data_inizio} → {p.data_scadenza}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.replaced_by_id && (
              <p className="text-sm">
                Sostituito da: <Link href={`/contratti/${c.replaced_by_id}`} className="hover:underline">apri rinnovo</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="col-span-2">{value}</span>
    </div>
  );
}

function addYear(iso: string): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 10.4: Page modifica**

```tsx
// src/app/(app)/contratti/[id]/modifica/page.tsx
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getContratto } from "@/lib/contratti/queries";
import { ContrattoForm } from "@/components/contratti/ContrattoForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const c = await getContratto(id);
  if (!c) notFound();

  const supabase = await createClient();
  const [clientiRes, fornitoriRes] = await Promise.all([
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica contratto</h1>
      <ContrattoForm contratto={c} clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} />
    </div>
  );
}
```

- [ ] **Step 10.5: Build + commit**

```bash
pnpm typecheck && pnpm build
git add src/app/\(app\)/contratti
git commit -m "feat(contratti): list/new/detail/edit pages with rinnovo and pdf download"
```

---

## Task 11: Documenti UI components + pagine

**Files:**
- Create: `src/components/documenti/DocumentoForm.tsx`, `src/components/documenti/DocumentiTable.tsx`, `src/components/documenti/DocumentoDeleteButton.tsx`, `src/app/(app)/documenti/page.tsx`, `src/app/(app)/documenti/[id]/modifica/page.tsx`

- [ ] **Step 11.1: DocumentoForm**

```tsx
// src/components/documenti/DocumentoForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  documentoSchema, TIPO_DOCUMENTO, TIPI_SCADENZA_RICHIESTA,
  type DocumentoInput,
} from "@/lib/validation/documento-schema";
import { createDocumento, updateDocumento } from "@/lib/documenti/actions";
import type { Documento, Cliente } from "@/lib/supabase/types";

type Props = {
  documento?: Documento;
  clienti: Pick<Cliente, "id" | "nome">[];
  defaultClienteId?: string;
};

export function DocumentoForm({ documento, clienti, defaultClienteId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DocumentoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(documentoSchema) as any,
    defaultValues: {
      cliente_id: documento?.cliente_id ?? defaultClienteId ?? "",
      tipo: documento?.tipo ?? "carta_identita",
      descrizione: documento?.descrizione ?? "",
      data_scadenza: documento?.data_scadenza ?? "",
      note: documento?.note ?? "",
    },
  });

  const tipo = form.watch("tipo");
  const richiesta = TIPI_SCADENZA_RICHIESTA.includes(tipo);
  const isAltro = tipo === "altro";

  async function onSubmit(values: DocumentoInput) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
      const fileInput = document.getElementById("file") as HTMLInputElement | null;
      if (fileInput?.files?.[0]) fd.append("file", fileInput.files[0]);

      const res = documento ? await updateDocumento(documento.id, fd) : await createDocumento(fd);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof DocumentoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(documento ? "Documento aggiornato" : "Documento caricato");
      router.push(documento ? `/clienti/${values.cliente_id}` : "/documenti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <select id="cliente_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("cliente_id")}>
                <option value="">— seleziona —</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select id="tipo" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("tipo")}>
                {TIPO_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {isAltro && (
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione *</Label>
              <Input id="descrizione" {...form.register("descrizione")} placeholder="Es. Contratto fornitura legna" />
              {form.formState.errors.descrizione && (
                <p className="text-sm text-destructive">{form.formState.errors.descrizione.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="data_scadenza">Data scadenza {richiesta ? "*" : "(opzionale)"}</Label>
            <Input id="data_scadenza" type="date" {...form.register("data_scadenza")} />
            {form.formState.errors.data_scadenza && (
              <p className="text-sm text-destructive">{form.formState.errors.data_scadenza.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={3} {...form.register("note")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File PDF {documento ? "(lascia vuoto per non sostituire)" : "*"}</Label>
            <input id="file" name="file" type="file" accept="application/pdf" className="block text-sm" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : documento ? "Salva modifiche" : "Carica documento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 11.2: DocumentiTable**

```tsx
// src/components/documenti/DocumentiTable.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import type { Documento } from "@/lib/supabase/types";

type Row = Documento & { cliente_nome?: string | null };

export function DocumentiTable({ rows }: { rows: Row[] }) {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "cliente_nome",
      header: "Cliente",
      cell: ({ row }) => (
        <Link href={`/clienti/${row.original.cliente_id}`} className="font-medium hover:underline">
          {row.original.cliente_nome ?? "—"}
        </Link>
      ),
    },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <span className="capitalize">{row.original.tipo.replace(/_/g, " ")}</span> },
    { accessorKey: "descrizione", header: "Descrizione" },
    {
      accessorKey: "data_scadenza",
      header: "Scadenza",
      cell: ({ row }) => row.original.data_scadenza ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.original.data_scadenza}</span>
          <ScadenzaBadge data={row.original.data_scadenza} />
        </div>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/documenti/${row.original.id}/modifica`} className="text-sm text-primary hover:underline">
          Modifica
        </Link>
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
```

- [ ] **Step 11.3: DocumentoDeleteButton**

```tsx
// src/components/documenti/DocumentoDeleteButton.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDocumento } from "@/lib/documenti/actions";
import { toast } from "sonner";

export function DocumentoDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteDocumento(id);
      if (!res.ok) toast.error(res.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
          <AlertDialogDescription>L&apos;operazione cancella anche il PDF dallo storage.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? "Elimino..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 11.4: Page lista documenti**

```tsx
// src/app/(app)/documenti/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listDocumenti, type DocumentiFilter } from "@/lib/documenti/queries";
import { DocumentiTable } from "@/components/documenti/DocumentiTable";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const entro = sp.entro ? Number(sp.entro) : undefined;
  const filter: DocumentiFilter = {
    cliente_id: sp.cliente_id,
    tipo: sp.tipo,
    in_scadenza_entro: (entro === 0 || entro === 15 || entro === 30 || entro === 60) ? entro : undefined,
  };

  const supabase = await createClient();
  const [documenti, clientiRes] = await Promise.all([
    listDocumenti(filter),
    supabase.from("clienti").select("id, nome").order("nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const rows = documenti.map((d) => ({ ...d, cliente_nome: clientiMap.get(d.cliente_id) ?? null }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documenti</h1>
        <p className="text-sm text-muted-foreground">I documenti si caricano dalla scheda cliente.</p>
      </div>
      <FilterBar />
      <DocumentiTable rows={rows} />
    </div>
  );
}

function FilterBar() {
  return (
    <form className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="entro">In scadenza entro</Label>
        <select id="entro" name="entro" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" onChange={(e) => { window.location.href = `/documenti?entro=${e.currentTarget.value}`; }}>
          <option value="">Tutti</option>
          <option value="60">60 giorni</option>
          <option value="30">30 giorni</option>
          <option value="15">15 giorni</option>
          <option value="0">Oggi</option>
        </select>
      </div>
    </form>
  );
}
```

- [ ] **Step 11.5: Page modifica documento**

```tsx
// src/app/(app)/documenti/[id]/modifica/page.tsx
import { notFound } from "next/navigation";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDocumento } from "@/lib/documenti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";
import { DocumentoDeleteButton } from "@/components/documenti/DocumentoDeleteButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { getDocumentoUrl } from "@/lib/documenti/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const d = await getDocumento(id);
  if (!d) notFound();
  const supabase = await createClient();
  const { data: clienti } = await supabase.from("clienti").select("id, nome").order("nome");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modifica documento</h1>
        <div className="flex items-center gap-2">
          {d.file_path !== "pending" && <PdfDownloadButton getUrl={() => getDocumentoUrl(d.id)} label="Scarica" />}
          {isAdmin(profile) && <DocumentoDeleteButton id={d.id} />}
        </div>
      </div>
      <DocumentoForm documento={d} clienti={clienti ?? []} />
    </div>
  );
}
```

- [ ] **Step 11.6: Build + commit**

```bash
pnpm typecheck && pnpm build
git add src/components/documenti/ src/app/\(app\)/documenti
git commit -m "feat(documenti): form, table, delete and pages"
```

---

## Task 12: Sezioni contratti+documenti su scheda cliente

**Files:**
- Create: `src/components/clienti/ClienteContrattiSection.tsx`, `src/components/clienti/ClienteDocumentiSection.tsx`
- Modify: `src/app/(app)/clienti/[id]/page.tsx`

- [ ] **Step 12.1: ClienteContrattiSection**

```tsx
// src/components/clienti/ClienteContrattiSection.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listContratti } from "@/lib/contratti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";

export async function ClienteContrattiSection({ clienteId, fornitoriMap }: { clienteId: string; fornitoriMap: Map<string, string> }) {
  const contratti = await listContratti({ cliente_id: clienteId });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Contratti ({contratti.length})</CardTitle>
        <Button size="sm" render={<Link href={`/contratti/nuovo?cliente=${clienteId}`}><Plus className="mr-2 h-4 w-4" /> Nuovo</Link>} />
      </CardHeader>
      <CardContent>
        {contratti.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun contratto.</p>
        ) : (
          <ul className="divide-y">
            {contratti.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/contratti/${c.id}`} className="hover:underline">
                  {fornitoriMap.get(c.fornitore_id) ?? "?"} · <span className="capitalize">{c.tipo}</span> · {c.data_scadenza}
                </Link>
                <div className="flex items-center gap-2">
                  <ContrattoStatoBadge stato={c.stato} />
                  {c.stato === "attivo" && <ScadenzaBadge data={c.data_scadenza} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 12.2: ClienteDocumentiSection**

```tsx
// src/components/clienti/ClienteDocumentiSection.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDocumenti } from "@/lib/documenti/queries";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";

export async function ClienteDocumentiSection({ clienteId }: { clienteId: string }) {
  const docs = await listDocumenti({ cliente_id: clienteId });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Documenti ({docs.length})</CardTitle>
        <Button size="sm" render={<Link href={`/clienti/${clienteId}/documenti/nuovo`}><Plus className="mr-2 h-4 w-4" /> Carica</Link>} />
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun documento.</p>
        ) : (
          <ul className="divide-y">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/documenti/${d.id}/modifica`} className="hover:underline capitalize">
                  {d.tipo.replace(/_/g, " ")} {d.descrizione ? `· ${d.descrizione}` : ""}
                </Link>
                {d.data_scadenza && <ScadenzaBadge data={d.data_scadenza} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 12.3: Aggiungi pagina /clienti/[id]/documenti/nuovo**

Create `src/app/(app)/clienti/[id]/documenti/nuovo/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getCliente } from "@/lib/clienti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo documento per {cliente.nome}</h1>
      <DocumentoForm clienti={[{ id: cliente.id, nome: cliente.nome }]} defaultClienteId={cliente.id} />
    </div>
  );
}
```

- [ ] **Step 12.4: Modifica /clienti/[id]/page.tsx**

Replace the existing page (from Plan #2) to include the two new sections below the existing anagrafica + mappa cards:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCliente } from "@/lib/clienti/queries";
import { ClienteMappa } from "@/components/clienti/ClienteMappa";
import { ClienteDeleteButton } from "@/components/clienti/ClienteDeleteButton";
import { ClienteContrattiSection } from "@/components/clienti/ClienteContrattiSection";
import { ClienteDocumentiSection } from "@/components/clienti/ClienteDocumentiSection";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const supabase = await createClient();
  const { data: fornitori } = await supabase.from("fornitori").select("id, nome");
  const fornitoriMap = new Map((fornitori ?? []).map((f) => [f.id, f.nome]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
          <Badge variant={cliente.tipo_cliente === "azienda" ? "default" : "secondary"} className="mt-1 capitalize">
            {cliente.tipo_cliente}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clienti/${cliente.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
          {isAdmin(profile) && <ClienteDeleteButton id={cliente.id} nome={cliente.nome} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value={cliente.email} />
            <Row label="Telefono" value={cliente.telefono} />
            <Row label="Indirizzo" value={cliente.indirizzo} />
            <Row label="Note" value={cliente.note} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mappa</CardTitle></CardHeader>
          <CardContent>
            <ClienteMappa lat={cliente.lat} lng={cliente.lng} label={cliente.nome} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ClienteContrattiSection clienteId={cliente.id} fornitoriMap={fornitoriMap} />
        <ClienteDocumentiSection clienteId={cliente.id} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}
```

- [ ] **Step 12.5: Build + commit**

```bash
pnpm typecheck && pnpm build
git add src/components/clienti/ClienteContrattiSection.tsx src/components/clienti/ClienteDocumentiSection.tsx src/app/\(app\)/clienti/\[id\]/page.tsx src/app/\(app\)/clienti/\[id\]/documenti
git commit -m "feat(clienti): contratti and documenti sections on cliente detail page"
```

---

## Task 13: Dashboard scadenze widget

**Files:**
- Create: `src/components/dashboard/ScadenzeWidget.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 13.1: ScadenzeWidget**

```tsx
// src/components/dashboard/ScadenzeWidget.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listContratti } from "@/lib/contratti/queries";
import { listDocumenti } from "@/lib/documenti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import { giorniAllaScadenza, classificaScadenza } from "@/lib/scadenze/helpers";
import type { Contratto, Documento } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type ContrattoRow = Contratto & { cliente_nome?: string | null; fornitore_nome?: string | null; giorni: number };
type DocumentoRow = Documento & { cliente_nome?: string | null; giorni: number };

export async function ScadenzeWidget() {
  const supabase = await createClient();
  const [contratti, documenti, clientiRes, fornitoriRes] = await Promise.all([
    listContratti({ in_scadenza_entro: 60 }),
    listDocumenti({ in_scadenza_entro: 60 }),
    supabase.from("clienti").select("id, nome"),
    supabase.from("fornitori").select("id, nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const fornitoriMap = new Map((fornitoriRes.data ?? []).map((f) => [f.id, f.nome]));

  const cRows: ContrattoRow[] = contratti.map((c) => ({
    ...c,
    cliente_nome: clientiMap.get(c.cliente_id) ?? null,
    fornitore_nome: fornitoriMap.get(c.fornitore_id) ?? null,
    giorni: giorniAllaScadenza(c.data_scadenza),
  })).sort((a, b) => a.giorni - b.giorni);

  const dRows: DocumentoRow[] = documenti.map((d) => ({
    ...d,
    cliente_nome: clientiMap.get(d.cliente_id) ?? null,
    giorni: d.data_scadenza ? giorniAllaScadenza(d.data_scadenza) : 999,
  })).sort((a, b) => a.giorni - b.giorni);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Contratti in scadenza ({cRows.length})</CardTitle></CardHeader>
        <CardContent>
          {cRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun contratto in scadenza nei prossimi 60 giorni.</p>
          ) : (
            <ul className="divide-y">
              {cRows.slice(0, 12).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/contratti/${c.id}`} className="truncate hover:underline">
                    <span className="font-medium">{c.cliente_nome ?? "?"}</span>
                    <span className="text-muted-foreground"> · {c.fornitore_nome ?? "?"} · {c.tipo}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <ContrattoStatoBadge stato={c.stato} />
                    <ScadenzaBadge data={c.data_scadenza} />
                  </div>
                </li>
              ))}
              {cRows.length > 12 && (
                <li className="pt-2 text-sm">
                  <Link href="/contratti?entro=60" className="text-primary hover:underline">+ {cRows.length - 12} altri →</Link>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Documenti in scadenza ({dRows.length})</CardTitle></CardHeader>
        <CardContent>
          {dRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun documento in scadenza nei prossimi 60 giorni.</p>
          ) : (
            <ul className="divide-y">
              {dRows.slice(0, 12).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/documenti/${d.id}/modifica`} className="truncate hover:underline">
                    <span className="font-medium">{d.cliente_nome ?? "?"}</span>
                    <span className="text-muted-foreground capitalize"> · {d.tipo.replace(/_/g, " ")}</span>
                  </Link>
                  <ScadenzaBadge data={d.data_scadenza} />
                </li>
              ))}
              {dRows.length > 12 && (
                <li className="pt-2 text-sm">
                  <Link href="/documenti?entro=60" className="text-primary hover:underline">+ {dRows.length - 12} altri →</Link>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 13.2: Modifica dashboard**

```tsx
// src/app/(app)/dashboard/page.tsx
import { Suspense } from "react";
import { requireProfile } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";
import { ScadenzeWidget } from "@/components/dashboard/ScadenzeWidget";

export default async function DashboardPage() {
  const profile = await requireProfile();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Benvenuto, {profile.nome_completo}</p>
      </div>
      <Suspense fallback={<div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
        <ScadenzeWidget />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 13.3: Build + commit**

```bash
pnpm typecheck && pnpm build
git add src/components/dashboard src/app/\(app\)/dashboard
git commit -m "feat(dashboard): scadenze widget with 60-day window"
```

---

## Task 14: Final verification

- [ ] **Step 14.1: All checks**

```bash
nvm use 22
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

All must pass. Expected counts:
- typecheck: 0 errors
- lint: 0 errors
- test:unit: 16 (Plan #2) + 11 (3 scadenze + 5 pdf + 5 contratto + 5 documento — adjust if test counts differ slightly) ≥ 27 passed
- build: ~25 routes (Plan #1+2 + contratti × 4 + documenti × 2 + clienti/[id]/documenti/nuovo)

- [ ] **Step 14.2: Acceptance**

Plan #3 acceptance criteria:
- [x] CRUD contratti (lista filtrata + nuovo + dettaglio + modifica + elimina + rinnova)
- [x] CRUD documenti (lista globale + nuovo da cliente + modifica + elimina)
- [x] Upload PDF su Storage privato con magic bytes + size + MIME validation
- [x] Download URL firmati 60s
- [x] Dashboard widget scadenze 60gg per contratti + documenti
- [x] Scheda cliente arricchita con sezioni contratti + documenti
- [x] RLS continua a funzionare (tutti i 28 test Plan #1 ancora passano)

---

**Fine Plan #3.**
