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
