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
