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
