# Broker Energetico — Plan #2: Anagrafiche

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRUD completo per **clienti** (con geocoding Nominatim + lat/lng manuali editabili) e **fornitori**, ricerca/filtri sulla lista clienti, export CSV. La sidebar già linka a `/clienti` e `/fornitori` (404 dopo Plan #1) — ora le route diventano funzionanti. Al termine: il broker può gestire le 600 anagrafiche reali end-to-end, con mappa per cliente.

**Architecture:** Server Components per liste/dettagli (fetch diretto Supabase server-side, RLS attiva da Plan #1). Server Actions per mutazioni con schema Zod condiviso client+server. Form con react-hook-form + shadcn. Geocoding chiamato server-side da Server Action al save. Mappa con Leaflet + tile OSM (nessuna API key). Export CSV come Server Action che genera response stream.

**Tech Stack:** Next.js 16 · TypeScript · @supabase/ssr · react-hook-form · zod · shadcn/ui (select, textarea, popover, dialog, alert-dialog, command) · TanStack Table · Leaflet · vitest · @playwright/test

**Spec di riferimento:** `docs/superpowers/specs/2026-05-06-broker-energetico-design.md` §5 (modello), §7 (UI), §8 (geocoding)
**Plan precedente:** `docs/superpowers/plans/2026-05-06-broker-foundation-auth.md` (mergiato in main)

---

## File Structure

```
broker-energetico/
├── src/
│   ├── components/
│   │   ├── ui/                        ADD via shadcn cli: select, textarea, popover,
│   │   │                              alert-dialog, command, sheet
│   │   ├── clienti/
│   │   │   ├── ClienteForm.tsx        NEW · create/update con geocoding on-blur
│   │   │   ├── ClientiTable.tsx       NEW · TanStack Table con sort/filter/pagination
│   │   │   ├── ClienteDeleteButton.tsx NEW · alert-dialog conferma
│   │   │   ├── ClientiFilters.tsx     NEW · ricerca + filtro tipo + fornitore + commerciale
│   │   │   ├── ClienteMappa.tsx       NEW · Leaflet read-only marker
│   │   │   ├── ClienteCoordinateEditor.tsx NEW · lat/lng manuali + ricalcola
│   │   │   └── ExportClientiButton.tsx NEW · Server Action genera CSV
│   │   ├── fornitori/
│   │   │   ├── FornitoreForm.tsx      NEW
│   │   │   ├── FornitoriTable.tsx     NEW
│   │   │   └── FornitoreDeleteButton.tsx NEW
│   │   └── shared/
│   │       └── DataTable.tsx          NEW · TanStack Table wrapper riusabile
│   ├── app/(app)/
│   │   ├── clienti/
│   │   │   ├── page.tsx               NEW · lista con filtri + ricerca + export
│   │   │   ├── nuovo/page.tsx         NEW · form creazione
│   │   │   ├── [id]/page.tsx          NEW · dettaglio con tabs (anagrafica · mappa · note)
│   │   │   └── [id]/modifica/page.tsx NEW · form modifica
│   │   └── fornitori/
│   │       ├── page.tsx               NEW · lista (read tutti, edit solo admin)
│   │       ├── nuovo/page.tsx         NEW · solo admin
│   │       ├── [id]/page.tsx          NEW · dettaglio
│   │       └── [id]/modifica/page.tsx NEW · solo admin
│   ├── lib/
│   │   ├── geocoding/
│   │   │   ├── nominatim.ts           NEW · geocodeAddress fn + wrapper geocodeOrLog
│   │   │   └── nominatim.test.ts      NEW · unit con fetch mocked
│   │   ├── csv/
│   │   │   └── export.ts              NEW · helper toCsv(rows, columns)
│   │   ├── clienti/
│   │   │   ├── actions.ts             NEW · Server Actions: create/update/delete cliente
│   │   │   └── queries.ts             NEW · helpers di fetch (lista filtrata, dettaglio)
│   │   ├── fornitori/
│   │   │   └── actions.ts             NEW · Server Actions: create/update/delete fornitore
│   │   └── validation/
│   │       ├── cliente-schema.ts      NEW · Zod schema condiviso
│   │       └── fornitore-schema.ts    NEW · Zod schema condiviso
│   └── types/
│       └── database.ts                MODIFY · rigenera con `pnpm db:types` (no schema changes,
│                                      ma garantisce sync con remote)
├── tests/
│   └── unit/
│       ├── geocoding.test.ts          NEW · alias di src/lib/geocoding/nominatim.test.ts
│       ├── csv.test.ts                NEW · helper export
│       └── cliente-schema.test.ts     NEW · zod schema validations
└── package.json                       MODIFY · aggiungere @tanstack/react-table, leaflet,
                                      react-leaflet, papaparse, @types/leaflet
```

---

## Conventions

- **No nuove migrazioni DB.** Lo schema è completo da Plan #1. Se servisse un indice extra, lo si aggiunge come migration nuova.
- **RLS già attiva** su `clienti` e `fornitori` (Plan #1 T12 e T13). Le Server Actions chiamano Supabase con `createClient()` server, e le policy fanno il filtering. Service client NON serve in questo plan.
- **Geocoding**: solo server-side (Nominatim ToS richiede User-Agent, evitiamo CORS).
- **Test**: unit test su geocoding + csv + zod schemas. Niente nuovi RLS test (le policy sono coperte in Plan #1). Smoke E2E aggiunto in Plan #1 (login) — non duplichiamo qui.

---

## Task 1: Aggiungere dipendenze e shadcn components

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/components/ui/{select,textarea,popover,alert-dialog,command,sheet}.tsx`

- [ ] **Step 1.1: Install dipendenze app**

```bash
pnpm add @tanstack/react-table leaflet react-leaflet papaparse
pnpm add -D @types/leaflet @types/papaparse
```

- [ ] **Step 1.2: Aggiungere shadcn components**

```bash
pnpm dlx shadcn@latest add select textarea popover alert-dialog command sheet
```

Verifica i 6 file in `src/components/ui/`.

- [ ] **Step 1.3: Smoke build**

```bash
pnpm build
```

Expected: build OK. Nessuna route nuova ancora.

- [ ] **Step 1.4: Commit**

```bash
git add -A
git commit -m "chore: add tanstack-table, leaflet, papaparse, shadcn components"
```

---

## Task 2: Schema Zod cliente + fornitore

**Files:**
- Create: `src/lib/validation/cliente-schema.ts`, `src/lib/validation/fornitore-schema.ts`, `tests/unit/cliente-schema.test.ts`

- [ ] **Step 2.1: `cliente-schema.ts`**

```ts
// src/lib/validation/cliente-schema.ts
import { z } from "zod";

export const clienteSchema = z.object({
  tipo_cliente: z.enum(["privato", "azienda"]),
  nome: z.string().trim().min(2, "Nome troppo corto").max(200),
  email: z.string().trim().email("Email non valida").optional().or(z.literal("")),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  indirizzo: z.string().trim().max(300).optional().or(z.literal("")),
  lat: z.coerce.number().gte(-90).lte(90).optional().nullable(),
  lng: z.coerce.number().gte(-180).lte(180).optional().nullable(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  commerciale_id: z.string().uuid().optional().nullable(),
}).refine(
  (d) => (d.lat == null && d.lng == null) || (d.lat != null && d.lng != null),
  { message: "Latitudine e longitudine devono essere entrambe valorizzate o vuote", path: ["lat"] },
);

export type ClienteInput = z.infer<typeof clienteSchema>;

export function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out as T;
}
```

- [ ] **Step 2.2: `fornitore-schema.ts`**

```ts
// src/lib/validation/fornitore-schema.ts
import { z } from "zod";

export const fornitoreSchema = z.object({
  nome: z.string().trim().min(2, "Nome troppo corto").max(200),
  contatti: z.object({
    referente: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Email non valida").optional().or(z.literal("")),
    telefono: z.string().trim().max(40).optional().or(z.literal("")),
  }).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  attivo: z.boolean().default(true),
});

export type FornitoreInput = z.infer<typeof fornitoreSchema>;
```

- [ ] **Step 2.3: Test schema cliente**

```ts
// tests/unit/cliente-schema.test.ts
import { describe, it, expect } from "vitest";
import { clienteSchema } from "@/lib/validation/cliente-schema";

describe("clienteSchema", () => {
  it("accepts a minimal valid cliente", () => {
    const r = clienteSchema.safeParse({ tipo_cliente: "privato", nome: "Mario Rossi" });
    expect(r.success).toBe(true);
  });

  it("rejects nome too short", () => {
    const r = clienteSchema.safeParse({ tipo_cliente: "privato", nome: "M" });
    expect(r.success).toBe(false);
  });

  it("rejects only one of lat/lng", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 41.9, lng: null,
    });
    expect(r.success).toBe(false);
  });

  it("accepts both lat/lng valorizzate", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 41.9028, lng: 12.4964,
    });
    expect(r.success).toBe(true);
  });

  it("rejects lat out of range", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 200, lng: 12,
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2.4: Run test**

```bash
pnpm test:unit
```

Expected: existing 3 + 5 new = 8 passed.

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/validation/cliente-schema.ts src/lib/validation/fornitore-schema.ts tests/unit/cliente-schema.test.ts
git commit -m "feat(validation): cliente and fornitore zod schemas"
```

---

## Task 3: Geocoding Nominatim

**Files:**
- Create: `src/lib/geocoding/nominatim.ts`, `src/lib/geocoding/nominatim.test.ts`

- [ ] **Step 3.1: Funzione `geocodeAddress`**

```ts
// src/lib/geocoding/nominatim.ts
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = { lat: number; lng: number } | null;

const TIMEOUT_MS = 5000;

export async function geocodeAddress(indirizzo: string): Promise<GeocodeResult> {
  if (!indirizzo || indirizzo.trim().length < 3) return null;

  const userAgent = process.env.NOMINATIM_USER_AGENT;
  if (!userAgent) {
    throw new Error("NOMINATIM_USER_AGENT env var not set");
  }

  const params = new URLSearchParams({
    q: indirizzo,
    format: "json",
    limit: "1",
    countrycodes: "it",
    addressdetails: "0",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Wrapper che logga ma non rilancia mai. Per usi dove il geocoding non è critico. */
export async function geocodeOrLog(indirizzo: string): Promise<GeocodeResult> {
  try {
    return await geocodeAddress(indirizzo);
  } catch (err) {
    console.warn("[geocoding] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
```

- [ ] **Step 3.2: Test con fetch mockato**

```ts
// src/lib/geocoding/nominatim.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geocodeAddress, geocodeOrLog } from "./nominatim";

const ORIGINAL_ENV = process.env.NOMINATIM_USER_AGENT;

beforeEach(() => {
  process.env.NOMINATIM_USER_AGENT = "test/1.0";
});
afterEach(() => {
  process.env.NOMINATIM_USER_AGENT = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

describe("geocodeAddress", () => {
  it("returns null for empty/short input", async () => {
    expect(await geocodeAddress("")).toBeNull();
    expect(await geocodeAddress(" ab ")).toBeNull();
  });

  it("returns lat/lng on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(
      JSON.stringify([{ lat: "41.9028", lon: "12.4964" }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    const r = await geocodeAddress("Roma");
    expect(r).toEqual({ lat: 41.9028, lng: 12.4964 });
  });

  it("returns null on empty result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));
    expect(await geocodeAddress("zzzzz nonexistent place 12345")).toBeNull();
  });

  it("returns null on non-200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    expect(await geocodeAddress("Roma")).toBeNull();
  });

  it("throws if NOMINATIM_USER_AGENT missing", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    await expect(geocodeAddress("Roma")).rejects.toThrow();
  });
});

describe("geocodeOrLog", () => {
  it("returns null instead of throwing when env missing", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    expect(await geocodeOrLog("Roma")).toBeNull();
  });
});
```

- [ ] **Step 3.3: Run test**

```bash
pnpm test:unit
```

Expected: passing.

- [ ] **Step 3.4: Commit**

```bash
git add src/lib/geocoding/nominatim.ts src/lib/geocoding/nominatim.test.ts
git commit -m "feat(geocoding): nominatim wrapper with timeout and fallback"
```

---

## Task 4: CSV export helper + test

**Files:**
- Create: `src/lib/csv/export.ts`, `tests/unit/csv.test.ts`

- [ ] **Step 4.1: Helper**

```ts
// src/lib/csv/export.ts
import Papa from "papaparse";

export type Column<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

export function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const data = rows.map((row) => {
    const obj: Record<string, string | number | null | undefined> = {};
    for (const col of columns) obj[col.header] = col.value(row);
    return obj;
  });
  return Papa.unparse(data, { quotes: true, delimiter: ";" });
}
```

> Delimiter `;` perché Excel italiano lo riconosce direttamente come default; per CSV strict si può cambiare a `,`. Lo manteniamo `;` per i nostri utenti finali.

- [ ] **Step 4.2: Test**

```ts
// tests/unit/csv.test.ts
import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv/export";

type Row = { nome: string; eta: number; email: string | null };

describe("toCsv", () => {
  it("produces header + rows separated by ;", () => {
    const rows: Row[] = [
      { nome: "Alice", eta: 30, email: "a@x" },
      { nome: "Bob", eta: 25, email: null },
    ];
    const csv = toCsv(rows, [
      { header: "Nome", value: (r) => r.nome },
      { header: "Eta", value: (r) => r.eta },
      { header: "Email", value: (r) => r.email },
    ]);
    expect(csv.split("\n")[0]).toBe('"Nome";"Eta";"Email"');
    expect(csv).toContain('"Alice";"30";"a@x"');
    expect(csv).toContain('"Bob";"25";""');
  });

  it("handles empty rows", () => {
    const csv = toCsv<Row>([], [
      { header: "Nome", value: (r) => r.nome },
    ]);
    expect(csv).toBe('"Nome"');
  });
});
```

- [ ] **Step 4.3: Run test**

```bash
pnpm test:unit
```

- [ ] **Step 4.4: Commit**

```bash
git add src/lib/csv/export.ts tests/unit/csv.test.ts
git commit -m "feat(csv): toCsv helper with semicolon delimiter for excel-it"
```

---

## Task 5: Server Actions clienti

**Files:**
- Create: `src/lib/clienti/actions.ts`, `src/lib/clienti/queries.ts`

- [ ] **Step 5.1: `queries.ts`**

```ts
// src/lib/clienti/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/supabase/types";

export type ClientiFilter = {
  q?: string;
  tipo?: "privato" | "azienda";
  commerciale_id?: string;
};

export async function listClienti(filter: ClientiFilter = {}): Promise<Cliente[]> {
  const supabase = await createClient();
  let query = supabase.from("clienti").select("*").order("created_at", { ascending: false });

  if (filter.tipo) query = query.eq("tipo_cliente", filter.tipo);
  if (filter.commerciale_id) query = query.eq("commerciale_id", filter.commerciale_id);
  if (filter.q && filter.q.trim().length >= 2) {
    const q = filter.q.trim();
    query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clienti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
```

- [ ] **Step 5.2: `actions.ts`**

```ts
// src/lib/clienti/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema, emptyToNull, type ClienteInput } from "@/lib/validation/cliente-schema";
import { geocodeOrLog } from "@/lib/geocoding/nominatim";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof ClienteInput, string>> };

function fieldErrors(parsed: ReturnType<typeof clienteSchema.safeParse>) {
  if (parsed.success) return undefined;
  const out: Partial<Record<keyof ClienteInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const k = issue.path[0] as keyof ClienteInput | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createCliente(raw: ClienteInput): Promise<ActionResult<{ id: string }>> {
  const profile = await requireProfile();
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };

  const data = emptyToNull(parsed.data);
  // commerciale può creare solo proprio cliente o orfano
  const commerciale_id =
    profile.ruolo === "commerciale" ? (data.commerciale_id ?? profile.id) : data.commerciale_id ?? null;

  // Geocode se mancano lat/lng e c'è indirizzo
  let { lat, lng } = data;
  if ((lat == null || lng == null) && data.indirizzo) {
    const r = await geocodeOrLog(String(data.indirizzo));
    if (r) { lat = r.lat; lng = r.lng; }
  }

  const supabase = await createClient();
  const { data: ins, error } = await supabase
    .from("clienti")
    .insert({
      tipo_cliente: data.tipo_cliente,
      nome: data.nome,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      indirizzo: data.indirizzo ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      note: data.note ?? null,
      commerciale_id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/clienti");
  return { ok: true, data: { id: ins!.id } };
}

export async function updateCliente(id: string, raw: ClienteInput): Promise<ActionResult> {
  await requireProfile();
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };

  const data = emptyToNull(parsed.data);
  let { lat, lng } = data;

  // Re-geocode SOLO se lat/lng non valorizzati a mano e indirizzo cambiato
  const supabase = await createClient();
  if ((lat == null || lng == null) && data.indirizzo) {
    const { data: existing } = await supabase
      .from("clienti")
      .select("indirizzo")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.indirizzo !== data.indirizzo) {
      const r = await geocodeOrLog(String(data.indirizzo));
      if (r) { lat = r.lat; lng = r.lng; }
    }
  }

  const { error } = await supabase
    .from("clienti")
    .update({
      tipo_cliente: data.tipo_cliente,
      nome: data.nome,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      indirizzo: data.indirizzo ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      note: data.note ?? null,
      commerciale_id: data.commerciale_id ?? null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/clienti");
  revalidatePath(`/clienti/${id}`);
  return { ok: true };
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("clienti").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clienti");
  redirect("/clienti");
}

export async function ricalcolaCoordinate(id: string): Promise<ActionResult<{ lat: number | null; lng: number | null }>> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("clienti").select("indirizzo").eq("id", id).maybeSingle();
  if (!data?.indirizzo) return { ok: false, error: "Indirizzo assente" };
  const r = await geocodeOrLog(String(data.indirizzo));
  await supabase.from("clienti").update({ lat: r?.lat ?? null, lng: r?.lng ?? null }).eq("id", id);
  revalidatePath(`/clienti/${id}`);
  return { ok: true, data: { lat: r?.lat ?? null, lng: r?.lng ?? null } };
}
```

- [ ] **Step 5.3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/lib/clienti/queries.ts src/lib/clienti/actions.ts
git commit -m "feat(clienti): server actions and queries with geocoding"
```

---

## Task 6: Server Actions fornitori

**Files:**
- Create: `src/lib/fornitori/actions.ts`, `src/lib/fornitori/queries.ts`

- [ ] **Step 6.1: `queries.ts`**

```ts
// src/lib/fornitori/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Fornitore } from "@/lib/supabase/types";

export async function listFornitori(): Promise<Fornitore[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fornitori").select("*").order("nome");
  return data ?? [];
}

export async function getFornitore(id: string): Promise<Fornitore | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("fornitori").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
```

- [ ] **Step 6.2: `actions.ts`**

```ts
// src/lib/fornitori/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fornitoreSchema, type FornitoreInput } from "@/lib/validation/fornitore-schema";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof FornitoreInput, string>> };

export async function createFornitore(raw: FornitoreInput): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");
  const parsed = fornitoreSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Partial<Record<keyof FornitoreInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof FornitoreInput | undefined;
      if (k && !fields[k]) fields[k] = issue.message;
    }
    return { ok: false, error: "Dati non validi", fields };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornitori")
    .insert({
      nome: parsed.data.nome,
      contatti: parsed.data.contatti ?? null,
      note: parsed.data.note || null,
      attivo: parsed.data.attivo,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  return { ok: true, data: { id: data!.id } };
}

export async function updateFornitore(id: string, raw: FornitoreInput): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = fornitoreSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("fornitori")
    .update({
      nome: parsed.data.nome,
      contatti: parsed.data.contatti ?? null,
      note: parsed.data.note || null,
      attivo: parsed.data.attivo,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  revalidatePath(`/fornitori/${id}`);
  return { ok: true };
}

export async function deleteFornitore(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("fornitori").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  redirect("/fornitori");
}
```

- [ ] **Step 6.3: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6.4: Commit**

```bash
git add src/lib/fornitori/queries.ts src/lib/fornitori/actions.ts
git commit -m "feat(fornitori): server actions and queries (admin-only mutations)"
```

---

## Task 7: ClienteForm componente

**Files:**
- Create: `src/components/clienti/ClienteForm.tsx`

- [ ] **Step 7.1: Form**

```tsx
// src/components/clienti/ClienteForm.tsx
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
import { clienteSchema, type ClienteInput } from "@/lib/validation/cliente-schema";
import { createCliente, updateCliente } from "@/lib/clienti/actions";
import type { Cliente, Profile } from "@/lib/supabase/types";

type Props = {
  cliente?: Cliente;
  commerciali: Pick<Profile, "id" | "nome_completo">[];
  currentRuolo: Profile["ruolo"];
  currentUserId: string;
};

export function ClienteForm({ cliente, commerciali, currentRuolo, currentUserId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_cliente: cliente?.tipo_cliente ?? "privato",
      nome: cliente?.nome ?? "",
      email: cliente?.email ?? "",
      telefono: cliente?.telefono ?? "",
      indirizzo: cliente?.indirizzo ?? "",
      lat: cliente?.lat ?? null,
      lng: cliente?.lng ?? null,
      note: cliente?.note ?? "",
      commerciale_id: cliente?.commerciale_id ?? (currentRuolo === "commerciale" ? currentUserId : null),
    },
  });

  async function onSubmit(values: ClienteInput) {
    setSubmitting(true);
    try {
      const res = cliente ? await updateCliente(cliente.id, values) : await createCliente(values);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof ClienteInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(cliente ? "Cliente aggiornato" : "Cliente creato");
      const id = cliente ? cliente.id : (res as { ok: true; data?: { id: string } }).data?.id;
      router.push(id ? `/clienti/${id}` : "/clienti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const isCommerciale = currentRuolo === "commerciale";

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo_cliente">Tipo</Label>
              <select
                id="tipo_cliente"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...form.register("tipo_cliente")}
              >
                <option value="privato">Privato</option>
                <option value="azienda">Azienda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome / Ragione sociale *</Label>
              <Input id="nome" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
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
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" {...form.register("telefono")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input id="indirizzo" {...form.register("indirizzo")} placeholder="Via, civico, città, CAP" />
            <p className="text-xs text-muted-foreground">
              Verrà geolocalizzato al salvataggio. Se preferisci coordinate manuali, compila lat/lng sotto.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitudine</Label>
              <Input id="lat" type="number" step="any" {...form.register("lat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitudine</Label>
              <Input id="lng" type="number" step="any" {...form.register("lng")} />
              {form.formState.errors.lat && (
                <p className="text-sm text-destructive">{form.formState.errors.lat.message}</p>
              )}
            </div>
          </div>
          {!isCommerciale && (
            <div className="space-y-2">
              <Label htmlFor="commerciale_id">Commerciale assegnato</Label>
              <select
                id="commerciale_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...form.register("commerciale_id")}
              >
                <option value="">— nessuno —</option>
                {commerciali.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome_completo}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={4} {...form.register("note")} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : cliente ? "Salva modifiche" : "Crea cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.2: Typecheck + build**

```bash
pnpm typecheck
pnpm build
```

- [ ] **Step 7.3: Commit**

```bash
git add src/components/clienti/ClienteForm.tsx
git commit -m "feat(clienti): cliente form component with geocoding hint"
```

---

## Task 8: ClientiTable + filters + export

**Files:**
- Create: `src/components/shared/DataTable.tsx`, `src/components/clienti/ClientiTable.tsx`, `src/components/clienti/ClientiFilters.tsx`, `src/components/clienti/ExportClientiButton.tsx`

- [ ] **Step 8.1: `DataTable.tsx` (TanStack wrapper)**

```tsx
// src/components/shared/DataTable.tsx
"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function DataTable<TData, TValue>({
  columns, data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  Nessun risultato.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} risultati · pagina {table.getState().pagination.pageIndex + 1} di {table.getPageCount() || 1}
        </span>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Precedente</Button>
          <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Successiva</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: `ClientiTable.tsx`**

```tsx
// src/components/clienti/ClientiTable.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import type { Cliente } from "@/lib/supabase/types";

type Row = Cliente & { commerciale_nome?: string | null };

export function ClientiTable({ rows }: { rows: Row[] }) {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => (
        <Link href={`/clienti/${row.original.id}`} className="font-medium hover:underline">
          {row.original.nome}
        </Link>
      ),
    },
    {
      accessorKey: "tipo_cliente",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={row.original.tipo_cliente === "azienda" ? "default" : "secondary"} className="capitalize">
          {row.original.tipo_cliente}
        </Badge>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "telefono", header: "Telefono" },
    {
      id: "commerciale",
      header: "Commerciale",
      cell: ({ row }) => row.original.commerciale_nome ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="ghost">
          <Link href={`/clienti/${row.original.id}/modifica`}>Modifica</Link>
        </Button>
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
```

- [ ] **Step 8.3: `ClientiFilters.tsx` (URL-driven)**

```tsx
// src/components/clienti/ClientiFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/types";

export function ClientiFilters({ commerciali }: { commerciali: Pick<Profile, "id" | "nome_completo">[] }) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/clienti?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="q">Ricerca</Label>
        <Input
          id="q"
          placeholder="Nome, email, telefono..."
          defaultValue={search.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={search.get("tipo") ?? ""}
          onChange={(e) => update("tipo", e.target.value)}
        >
          <option value="">Tutti</option>
          <option value="privato">Privato</option>
          <option value="azienda">Azienda</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="commerciale">Commerciale</Label>
        <select
          id="commerciale"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={search.get("commerciale_id") ?? ""}
          onChange={(e) => update("commerciale_id", e.target.value)}
        >
          <option value="">Tutti</option>
          {commerciali.map((c) => (
            <option key={c.id} value={c.id}>{c.nome_completo}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.4: `ExportClientiButton.tsx`**

```tsx
// src/components/clienti/ExportClientiButton.tsx
"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportClientiButton({ params }: { params: Record<string, string> }) {
  function onClick() {
    const qs = new URLSearchParams(params).toString();
    window.location.href = `/clienti/export${qs ? "?" + qs : ""}`;
  }
  return (
    <Button onClick={onClick} variant="outline">
      <Download className="mr-2 h-4 w-4" /> Esporta CSV
    </Button>
  );
}
```

- [ ] **Step 8.5: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 8.6: Commit**

```bash
git add src/components/shared/DataTable.tsx src/components/clienti/ClientiTable.tsx src/components/clienti/ClientiFilters.tsx src/components/clienti/ExportClientiButton.tsx
git commit -m "feat(clienti): data-table, filters, export button"
```

---

## Task 9: Pagine clienti (lista + nuovo + dettaglio + modifica + export route)

**Files:**
- Create: `src/app/(app)/clienti/page.tsx`, `src/app/(app)/clienti/nuovo/page.tsx`, `src/app/(app)/clienti/[id]/page.tsx`, `src/app/(app)/clienti/[id]/modifica/page.tsx`, `src/app/clienti/export/route.ts`, `src/components/clienti/ClienteMappa.tsx`, `src/components/clienti/ClienteDeleteButton.tsx`

- [ ] **Step 9.1: Page lista**

```tsx
// src/app/(app)/clienti/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listClienti, type ClientiFilter } from "@/lib/clienti/queries";
import { ClientiTable } from "@/components/clienti/ClientiTable";
import { ClientiFilters } from "@/components/clienti/ClientiFilters";
import { ExportClientiButton } from "@/components/clienti/ExportClientiButton";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const filter: ClientiFilter = {
    q: sp.q,
    tipo: sp.tipo === "privato" || sp.tipo === "azienda" ? sp.tipo : undefined,
    commerciale_id: sp.commerciale_id || undefined,
  };
  const supabase = await createClient();
  const [clienti, profilesRes] = await Promise.all([
    listClienti(filter),
    supabase.from("profiles").select("id, nome_completo, ruolo").eq("ruolo", "commerciale"),
  ]);
  const commerciali = profilesRes.data ?? [];
  const commercialiMap = new Map(commerciali.map((p) => [p.id, p.nome_completo]));
  const rows = clienti.map((c) => ({ ...c, commerciale_nome: c.commerciale_id ? commercialiMap.get(c.commerciale_id) ?? null : null }));

  const exportParams: Record<string, string> = {};
  if (filter.q) exportParams.q = filter.q;
  if (filter.tipo) exportParams.tipo = filter.tipo;
  if (filter.commerciale_id) exportParams.commerciale_id = filter.commerciale_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clienti</h1>
        <div className="flex items-center gap-2">
          <ExportClientiButton params={exportParams} />
          <Button asChild>
            <Link href="/clienti/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo cliente</Link>
          </Button>
        </div>
      </div>
      <ClientiFilters commerciali={commerciali} />
      <ClientiTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 9.2: Page nuovo**

```tsx
// src/app/(app)/clienti/nuovo/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clienti/ClienteForm";

export default async function Page() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: commerciali } = await supabase
    .from("profiles")
    .select("id, nome_completo")
    .eq("ruolo", "commerciale")
    .order("nome_completo");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo cliente</h1>
      <ClienteForm
        commerciali={commerciali ?? []}
        currentRuolo={profile.ruolo}
        currentUserId={profile.id}
      />
    </div>
  );
}
```

- [ ] **Step 9.3: `ClienteMappa.tsx` (dynamic import per evitare SSR Leaflet)**

```tsx
// src/components/clienti/ClienteMappa.tsx
"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const Map = dynamic(async () => {
  const { MapContainer, TileLayer, Marker, Popup } = await import("react-leaflet");
  const L = await import("leaflet");
  // Fix marker icon path issue with bundlers
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  return function MapInner({ lat, lng, label }: { lat: number; lng: number; label: string }) {
    return (
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: 360, borderRadius: 8 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}><Popup>{label}</Popup></Marker>
      </MapContainer>
    );
  };
}, { ssr: false });

export function ClienteMappa({ lat, lng, label }: { lat: number | null; lng: number | null; label: string }) {
  if (lat == null || lng == null) {
    return (
      <div className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground">
        Coordinate non disponibili. Compila l'indirizzo e salva, oppure inserisci lat/lng a mano.
      </div>
    );
  }
  return <Map lat={lat} lng={lng} label={label} />;
}
```

- [ ] **Step 9.4: `ClienteDeleteButton.tsx`**

```tsx
// src/components/clienti/ClienteDeleteButton.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCliente } from "@/lib/clienti/actions";
import { toast } from "sonner";

export function ClienteDeleteButton({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteCliente(id);
      if (!res.ok) toast.error(res.error);
      // success → redirect a /clienti gestito dalla Server Action
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;operazione è irreversibile. Verranno cancellati anche i contratti e i documenti collegati.
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

- [ ] **Step 9.5: Page dettaglio**

```tsx
// src/app/(app)/clienti/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { getCliente } from "@/lib/clienti/queries";
import { ClienteMappa } from "@/components/clienti/ClienteMappa";
import { ClienteDeleteButton } from "@/components/clienti/ClienteDeleteButton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

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
          <Button asChild variant="outline">
            <Link href={`/clienti/${cliente.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>
          </Button>
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

- [ ] **Step 9.6: Page modifica**

```tsx
// src/app/(app)/clienti/[id]/modifica/page.tsx
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCliente } from "@/lib/clienti/queries";
import { ClienteForm } from "@/components/clienti/ClienteForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const supabase = await createClient();
  const { data: commerciali } = await supabase
    .from("profiles")
    .select("id, nome_completo")
    .eq("ruolo", "commerciale")
    .order("nome_completo");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica {cliente.nome}</h1>
      <ClienteForm
        cliente={cliente}
        commerciali={commerciali ?? []}
        currentRuolo={profile.ruolo}
        currentUserId={profile.id}
      />
    </div>
  );
}
```

- [ ] **Step 9.7: Route handler export CSV**

```ts
// src/app/clienti/export/route.ts
import { requireProfile } from "@/lib/auth/session";
import { listClienti, type ClientiFilter } from "@/lib/clienti/queries";
import { toCsv } from "@/lib/csv/export";

export async function GET(req: Request) {
  await requireProfile();
  const url = new URL(req.url);
  const filter: ClientiFilter = {
    q: url.searchParams.get("q") ?? undefined,
    tipo: (url.searchParams.get("tipo") as "privato" | "azienda" | null) ?? undefined,
    commerciale_id: url.searchParams.get("commerciale_id") ?? undefined,
  };
  const rows = await listClienti(filter);

  const csv = toCsv(rows, [
    { header: "Tipo",         value: (r) => r.tipo_cliente },
    { header: "Nome",         value: (r) => r.nome },
    { header: "Email",        value: (r) => r.email ?? "" },
    { header: "Telefono",     value: (r) => r.telefono ?? "" },
    { header: "Indirizzo",    value: (r) => r.indirizzo ?? "" },
    { header: "Latitudine",   value: (r) => r.lat ?? "" },
    { header: "Longitudine",  value: (r) => r.lng ?? "" },
    { header: "Note",         value: (r) => r.note ?? "" },
    { header: "Commerciale",  value: (r) => r.commerciale_id ?? "" },
    { header: "Creato il",    value: (r) => r.created_at },
  ]);

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienti-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
```

> Note: `﻿` BOM all'inizio aiuta Excel italiano a riconoscere la codifica UTF-8.

- [ ] **Step 9.8: Build + typecheck**

```bash
pnpm typecheck
pnpm build
```

Expected: build OK. La sidebar a `/clienti` ora porta a una pagina funzionante.

- [ ] **Step 9.9: Commit**

```bash
git add src/app/\(app\)/clienti src/app/clienti/export/route.ts src/components/clienti/ClienteMappa.tsx src/components/clienti/ClienteDeleteButton.tsx
git commit -m "feat(clienti): list/new/detail/edit pages with map and csv export"
```

---

## Task 10: FornitoreForm + FornitoriTable + FornitoreDeleteButton

**Files:**
- Create: `src/components/fornitori/FornitoreForm.tsx`, `src/components/fornitori/FornitoriTable.tsx`, `src/components/fornitori/FornitoreDeleteButton.tsx`

- [ ] **Step 10.1: Form**

```tsx
// src/components/fornitori/FornitoreForm.tsx
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
import { fornitoreSchema, type FornitoreInput } from "@/lib/validation/fornitore-schema";
import { createFornitore, updateFornitore } from "@/lib/fornitori/actions";
import type { Fornitore } from "@/lib/supabase/types";

export function FornitoreForm({ fornitore }: { fornitore?: Fornitore }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FornitoreInput>({
    resolver: zodResolver(fornitoreSchema),
    defaultValues: {
      nome: fornitore?.nome ?? "",
      contatti: (fornitore?.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {
        referente: "", email: "", telefono: "",
      },
      note: fornitore?.note ?? "",
      attivo: fornitore?.attivo ?? true,
    },
  });

  async function onSubmit(values: FornitoreInput) {
    setSubmitting(true);
    try {
      const res = fornitore ? await updateFornitore(fornitore.id, values) : await createFornitore(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(fornitore ? "Fornitore aggiornato" : "Fornitore creato");
      router.push("/fornitori");
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
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...form.register("nome")} />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="referente">Referente</Label>
              <Input id="referente" {...form.register("contatti.referente")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" {...form.register("contatti.email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctelefono">Telefono</Label>
              <Input id="ctelefono" {...form.register("contatti.telefono")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={4} {...form.register("note")} />
          </div>
          <div className="flex items-center gap-2">
            <input id="attivo" type="checkbox" {...form.register("attivo")} className="h-4 w-4" />
            <Label htmlFor="attivo">Fornitore attivo</Label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : fornitore ? "Salva modifiche" : "Crea fornitore"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10.2: Table**

```tsx
// src/components/fornitori/FornitoriTable.tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Fornitore } from "@/lib/supabase/types";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { Profile } from "@/lib/supabase/types";

export function FornitoriTable({ rows, currentRuolo }: { rows: Fornitore[]; currentRuolo: Profile["ruolo"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Referente</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefono</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nessun fornitore.</TableCell></TableRow>
        )}
        {rows.map((f) => {
          const c = (f.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {};
          return (
            <TableRow key={f.id}>
              <TableCell>
                <Link href={`/fornitori/${f.id}`} className="font-medium hover:underline">{f.nome}</Link>
              </TableCell>
              <TableCell>{c.referente ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{c.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{c.telefono ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                {f.attivo ? <Badge variant="secondary">Attivo</Badge> : <Badge variant="outline">Disattivato</Badge>}
              </TableCell>
              <TableCell>
                <RoleGuard ruolo={currentRuolo} ruoli={["admin"]}>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/fornitori/${f.id}/modifica`}>Modifica</Link>
                  </Button>
                </RoleGuard>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 10.3: DeleteButton**

```tsx
// src/components/fornitori/FornitoreDeleteButton.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteFornitore } from "@/lib/fornitori/actions";
import { toast } from "sonner";

export function FornitoreDeleteButton({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteFornitore(id);
      if (!res.ok) toast.error(res.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;eliminazione fallisce se esistono contratti collegati. Per disattivarlo senza cancellarlo, modifica la voce &quot;Stato&quot; nel form.
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

- [ ] **Step 10.4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/fornitori/
git commit -m "feat(fornitori): form, table, delete button"
```

---

## Task 11: Pagine fornitori

**Files:**
- Create: `src/app/(app)/fornitori/page.tsx`, `src/app/(app)/fornitori/nuovo/page.tsx`, `src/app/(app)/fornitori/[id]/page.tsx`, `src/app/(app)/fornitori/[id]/modifica/page.tsx`

- [ ] **Step 11.1: Page lista**

```tsx
// src/app/(app)/fornitori/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { listFornitori } from "@/lib/fornitori/queries";
import { FornitoriTable } from "@/components/fornitori/FornitoriTable";

export default async function Page() {
  const profile = await requireProfile();
  const fornitori = await listFornitori();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fornitori</h1>
        {isAdmin(profile) && (
          <Button asChild>
            <Link href="/fornitori/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo fornitore</Link>
          </Button>
        )}
      </div>
      <Card><CardContent className="p-0"><FornitoriTable rows={fornitori} currentRuolo={profile.ruolo} /></CardContent></Card>
    </div>
  );
}
```

- [ ] **Step 11.2: Page nuovo (admin only)**

```tsx
// src/app/(app)/fornitori/nuovo/page.tsx
import { requireRole } from "@/lib/auth/session";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo fornitore</h1>
      <FornitoreForm />
    </div>
  );
}
```

- [ ] **Step 11.3: Page dettaglio**

```tsx
// src/app/(app)/fornitori/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreDeleteButton } from "@/components/fornitori/FornitoreDeleteButton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  const c = (f.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{f.nome}</h1>
          <Badge variant={f.attivo ? "secondary" : "outline"} className="mt-1">{f.attivo ? "Attivo" : "Disattivato"}</Badge>
        </div>
        {isAdmin(profile) && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/fornitori/${f.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>
            </Button>
            <FornitoreDeleteButton id={f.id} nome={f.nome} />
          </div>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle>Contatti</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Referente" value={c.referente} />
          <Row label="Email" value={c.email} />
          <Row label="Telefono" value={c.telefono} />
          <Row label="Note" value={f.note} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}
```

- [ ] **Step 11.4: Page modifica (admin only)**

```tsx
// src/app/(app)/fornitori/[id]/modifica/page.tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica {f.nome}</h1>
      <FornitoreForm fornitore={f} />
    </div>
  );
}
```

- [ ] **Step 11.5: Build + commit**

```bash
pnpm typecheck
pnpm build
git add src/app/\(app\)/fornitori
git commit -m "feat(fornitori): list/new/detail/edit pages"
```

---

## Task 12: Final verification

- [ ] **Step 12.1: Run all checks**

```bash
nvm use 22
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:rls
pnpm build
```

All must pass. Expected:
- typecheck: 0 errors
- lint: 0 errors
- test:unit: 11+ passed (3 from Plan #1 + 5 cliente schema + 6 geocoding + 2 csv)
- test:rls: 28 passed (unchanged from Plan #1)
- build: 14+ routes (Plan #1 routes + clienti × 4 + fornitori × 4 + clienti/export)

- [ ] **Step 12.2: Smoke manuale (opzionale, se tempo)**

```bash
pnpm dev
```

Verifica:
- /clienti elenco vuoto
- /clienti/nuovo: crea un cliente con indirizzo (Roma) → verifica geocoding
- /clienti/<id>: vedi mappa con marker
- /clienti/<id>/modifica: cambia nome → salva → torna in dettaglio
- /clienti?q=Roma → filtro
- Bottone "Esporta CSV" → download
- /fornitori da admin: crea Enel → modifica → vedi nella lista

- [ ] **Step 12.3: Verifica acceptance criteria**

Final state of Plan #2:
- [x] CRUD clienti completo (lista + nuovo + dettaglio con mappa + modifica + elimina)
- [x] Geocoding Nominatim al save (lat/lng manuali editabili)
- [x] CRUD fornitori (admin-only mutations)
- [x] Filtri e ricerca su /clienti
- [x] Export CSV con BOM UTF-8 (Excel italiano)
- [x] Sidebar `/clienti` e `/fornitori` non più 404
- [x] RLS continua a funzionare (tutti i test Plan #1 passano)

---

**Fine Plan #2.**
