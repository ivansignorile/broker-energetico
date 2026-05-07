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
