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
