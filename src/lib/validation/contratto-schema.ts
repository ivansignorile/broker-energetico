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
