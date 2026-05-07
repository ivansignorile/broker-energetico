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
